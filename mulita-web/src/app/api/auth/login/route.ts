import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

// Definición del esquema de validación para el login
const loginSchema = z.object({
  email: z.email(), // Validación de email
  contrasena: z.string().min(6), // Validación de contraseña con mínimo 6 caracteres
});

// Función para manejar la solicitud POST de login
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = loginSchema.parse(body); // Validación de los datos recibidos según el esquema definido

    // 1. Intentar login con Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ // Intento de inicio de sesión con email y contraseña
        email: data.email,
        password: data.contrasena,
      });

    if (authError) {
      throw new Error(authError.message);
    }

    const user = authData.user; // Obtener el usuario autenticado
    const session = authData.session; // Obtener la sesión del usuario autenticado
    if (!user || !session) {
      throw new Error("No se pudo obtener usuario o sesión");
    }

    // 2. Buscar datos adicionales en tabla usuario
    const { data: usuario, error: usuarioError } = await supabase
      .from("usuario") // Seleccionar la tabla "usuario"
      .select("*") // Seleccionar todos los campos
      .eq("id", user.id) // Filtrar por el ID del usuario autenticado
      .single(); // Obtener un solo registro

    if (usuarioError) {
      throw new Error(usuarioError.message);
    }

    // 3. Buscar imagen de perfil
    const { data: perfil, error: perfilError } = await supabase // Buscar la imagen de perfil del usuario en la tabla "perfil"
      .from("perfil")
      .select("imagen")
      .eq("id", user.id)
      .single();

     if (perfilError || !perfil) {
      // Si no existe el perfil, cancelar el login
      throw new Error("El usuario no tiene un perfil asociado. No se puede iniciar sesión.");
    }

    // 4. Si es docente, buscar sus datos también
    let docente = null;
    if (usuario.rol === "docente") {
      const { data: docenteData, error: docenteError } = await supabase
        .from("docente")
        .select("*")
        .eq("id_usuario", user.id)
        .single();

      if (docenteError && docenteError.code !== "PGRST116") {
        throw new Error(docenteError.message);
      }
      docente = docenteData;
    }

    // 5. Guardar tokens en cookies HTTP-only para persistencia de sesión
    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        rol: usuario.rol,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        telefono: usuario.telefono,
        imagen: perfil.imagen || null,
        docente,
      },
    });

    res.cookies.set("sb-access-token", session.access_token, { // Guardar el token de acceso en una cookie HTTP-only
      httpOnly: true,
      path: "/", // La cookie es accesible en toda la aplicación
      secure: process.env.NODE_ENV === "production", 
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 días
    });

    res.cookies.set("sb-refresh-token", session.refresh_token, { // Guardar el token de refresco en una cookie HTTP-only
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 días
    });

    return res;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }
}
