import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// Función para manejar la solicitud POST de validación de token
export async function POST(req: NextRequest) {
  try {
    const { access_token, refresh_token } = await req.json(); // Obtener los tokens de acceso y refresco del cuerpo de la solicitud

    if (!access_token) { // Si no se proporciona un token de acceso, devolver un error
      return NextResponse.json(
        { success: false, message: "Token no proporcionado" },
        { status: 400 }
      );
    }

    // 1. Validar el token con Supabase
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser(access_token);
    
    if (authError || !user) { // Si hay un error al validar el token o no se encuentra el usuario, devolver un error
      return NextResponse.json(
        { success: false, message: "Token inválido" },
        { status: 401 }
      );
    }

    // 2. Obtener la sesión para tener el refresh token
    const { data: sessionData, error: sessionError } = await supabaseServer.auth.setSession({ // Establecer la sesión con el token de acceso y refresco
      access_token, // El token de acceso proporcionado
      refresh_token: refresh_token || '', // El token de refresco proporcionado o una cadena vacía si no se proporciona
    });

    // Si hay un error al establecer la sesión o no se obtiene la sesión, devolver un error
    if (sessionError || !sessionData.session) {
      return NextResponse.json(
        { success: false, message: "Error al establecer sesión" },
        { status: 401 }
      );
    }

    // 3. Buscar datos adicionales en tabla usuario
    const { data: usuario, error: usuarioError } = await supabaseServer
      .from("usuario")
      .select("*")
      .eq("id", user.id)
      .single();

    if (usuarioError) {
      return NextResponse.json(
        { success: false, message: "Error al obtener datos del usuario" },
        { status: 400 }
      );
    }

    // 4. Buscar imagen de perfil
    const { data: perfil, error: perfilError } = await supabaseServer
      .from("perfil")
      .select("imagen")
      .eq("id", user.id)
      .single();

    if (perfilError || !perfil) {
      return NextResponse.json(
        { success: false, message: "El usuario no tiene un perfil asociado" },
        { status: 400 }
      );
    }

    // 5. Si es docente, buscar sus datos también
    let docente = null;
    if (usuario.rol === "docente") {
      const { data: docenteData, error: docenteError } = await supabaseServer
        .from("docente")
        .select("*")
        .eq("id_usuario", user.id)
        .single();

      // Si hay un error al obtener los datos del docente y no es un error de "no encontrado", devolver un error
      if (docenteError && docenteError.code !== "PGRST116") {
        return NextResponse.json(
          { success: false, message: "Error al obtener datos del docente" },
          { status: 400 }
        );
      }
      docente = docenteData; // Guardar los datos del docente si se encuentran
    }

    // 6. Guardar tokens en cookies HTTP-only para persistencia de sesión
    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        rol: usuario.rol,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        telefono: usuario.telefono,
        acceso_comunidad: usuario.acceso_comunidad,
        imagen: perfil.imagen || null,
        docente,
      },
    });

    res.cookies.set("sb-access-token", sessionData.session.access_token, { // Guardar el token de acceso en una cookie HTTP-only
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 días
    });

    res.cookies.set("sb-refresh-token", sessionData.session.refresh_token, { 
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 días
    });

    return res;
  } catch (error: any) {
    console.error("Error validando token:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}