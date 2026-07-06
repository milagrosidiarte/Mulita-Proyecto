import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// Definimos rutas especiales (requieren ciertos permisos)
const comunidadPaths = ["/comunidad"]; // solo usuarios con acceso_comunidad = true
const adminOnlyPaths = ["/dashboard", "/dashboard/gestionUsuarios"]; // solo admins y superAdmins
const authRequiredPaths = ["/perfil"] //estar logueado para acceder a estas rutas

export async function middleware(req: NextRequest) { //prepara la respuesta y verifica permisos
  const url = req.nextUrl.clone(); // Clonamos la URL para poder modificarla si es necesario, URL de la petición original
  let access_token = req.cookies.get("sb-access-token")?.value; // Intentamos obtener el access token desde las cookies HttpOnly
  const refresh_token = req.cookies.get("sb-refresh-token")?.value; // Intentamos obtener el refresh token desde las cookies HttpOnly

  // Si no hay access token pero hay refresh token, intentar refrescar
  if (!access_token && refresh_token) { //
    try { 
      const { data, error } = await supabaseServer.auth.refreshSession({ refresh_token }); // Intentamos refrescar la sesión usando el refresh token
      if (!error && data.session && data.user) { // Si la sesión se refrescó correctamente, actualizamos el access token
        access_token = data.session.access_token; // Actualizamos el access token para continuar con la verificación de permisos
        
        // Crear respuesta con las nuevas cookies
        const res = NextResponse.next(); 
        res.cookies.set("sb-access-token", data.session.access_token, { // Actualizamos la cookie del access token
          httpOnly: true, // Solo accesible desde el servidor
          path: "/", // La cookie es válida para todo el dominio
          secure: process.env.NODE_ENV === "production", // Solo se envía en conexiones HTTPS en producción
          sameSite: "lax", //
          maxAge: 60 * 60 * 24 * 30, // 30 días 
        });
        
        if (data.session.refresh_token) { // Si hay un nuevo refresh token, actualizamos la cookie del refresh token
          res.cookies.set("sb-refresh-token", data.session.refresh_token, {   
            httpOnly: true, 
            path: "/",
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30, // 30 días
          });
        }
        
        // Continuar con la verificación de permisos
        return await checkPermissions(req, res, data.user, access_token!);
      }
    } catch (error) {
      console.error("Error refrescando token:", error); // Si hay un error al refrescar, continuamos sin access token
    }
  }

  // Si no hay token → redirigir al inicio con mensaje
  if (!access_token) {
    url.pathname = "/"; 
    url.searchParams.set("mensaje", "Sesión cerrada o no iniciada");
    return NextResponse.redirect(url); 
  }

  // Intentar obtener el usuario desde Supabase
  const { data: { user }, error } = await supabaseServer.auth.getUser(access_token);
  if (error || !user) { // Si hay error o no se obtiene usuario, redirigir al inicio con mensaje
    url.pathname = "/";
    url.searchParams.set("mensaje", "Sesión cerrada o inválida");
    return NextResponse.redirect(url);
  }

  // Continuar con la verificación de permisos
  return await checkPermissions(req, NextResponse.next(), user, access_token);
}

async function checkPermissions(req: NextRequest, res: NextResponse, user: any, access_token: string) { // Función para verificar permisos del usuario según la ruta
  const url = req.nextUrl.clone(); 

  try {
    // Buscar información extra en la tabla usuario
    const { data: usuario, error: usuarioError } = await supabaseServer
      .from("usuario")
      .select("rol, acceso_comunidad, eliminado") // Seleccionamos los campos necesarios
      .eq("id", user.id) //id del usuario autenticado 
      .single(); // Obtenemos un solo registro de la tabla usuario

    // Si hay error o usuario no encontrado
    if (usuarioError || !usuario) { // check si el usuario existe en la tabla usuario
      url.pathname = "/"; // Redirigimos al inicio si no se encuentra el usuario en la tabla usuario con el mensaje de acceso restringido
      url.searchParams.set("mensaje", "Acceso restringido"); //searchParams.set agrega un parámetro de búsqueda a la URL, en este caso "mensaje" con el valor "Acceso restringido"
      return NextResponse.redirect(url); 
    }

    // Bloquear si el usuario está eliminado (soft delete)
    if (usuario.eliminado) { // Si el usuario está marcado como eliminado, redirigimos al inicio con un mensaje de cuenta deshabilitada
      url.pathname = "/";
      url.searchParams.set("mensaje", "Tu cuenta está deshabilitada");
      return NextResponse.redirect(url);
    }

    // REGLAS DE ACCESO
    // Comunidad: solo si acceso_comunidad = true
    if (comunidadPaths.some((p) => url.pathname.startsWith(p))) { //comunidadPaths.some verifica si alguna de las rutas definidas en comunidadPaths coincide con el inicio de la ruta actual (url.pathname)
      if (!usuario.acceso_comunidad) {
        url.pathname = "/";
        url.searchParams.set("mensaje", "Acceso restringido a la comunidad");
        return NextResponse.redirect(url);
      }
    }

    if (authRequiredPaths.some((p) => url.pathname.startsWith(p))) { //authRequiredPaths.some verifica si alguna de las rutas definidas en authRequiredPaths coincide con el inicio de la ruta actual (url.pathname)
      if (!access_token) { // requiere estar logueado para acceder a perfil, si no hay access_token redirige al inicio con mensaje
        url.pathname = "/";
        url.searchParams.set("mensaje", "Tenés que iniciar sesión");
        return NextResponse.redirect(url);
      }
    }

    // Dashboard: solo admins y superAdmins
    if (adminOnlyPaths.some((p) => url.pathname.startsWith(p))) { //adminOnlyPaths.some verifica si alguna de las rutas definidas en adminOnlyPaths coincide con el inicio de la ruta actual (url.pathname)
      if (usuario.rol !== "admin" && usuario.rol !== "superAdmin") { // Si el rol del usuario no es admin ni superAdmin, redirige al inicio con mensaje de permisos insuficientes
        url.pathname = "/";
        url.searchParams.set("mensaje", "No tenés permisos para acceder al panel");
        return NextResponse.redirect(url);
      }
    }

    // Si todo está bien, permite continuar
    return res; // retorna la respuesta original (res) que permite continuar con la petición, ya que el usuario tiene los permisos necesarios para acceder a la ruta solicitada
  } catch (error) { 
    console.error("Error en checkPermissions:", error);
    url.pathname = "/";
    url.searchParams.set("mensaje", "Error de autenticación");
    return NextResponse.redirect(url);
  }
}

// Define en qué rutas aplica el middleware
export const config = { // Configuración del middleware para especificar las rutas que deben ser protegidas por la lógica de autenticación y autorización definida en el middleware
  matcher: [
    "/dashboard/:path*", 
    "/perfil/:path*"
  ],
};

