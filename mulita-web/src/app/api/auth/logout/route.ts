import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Función para manejar la solicitud POST de logout
export async function POST(req: NextRequest) {
  try {
    await supabase.auth.signOut(); // opcional porque supabase maneja la sesión en el cliente, pero es buena práctica cerrar sesión en el servidor también

    const response = NextResponse.json({ success: true }); // Crear una respuesta JSON indicando éxito

    response.cookies.delete({ name: "sb-access-token", path: "/" }); // Eliminar la cookie del token de acceso
    response.cookies.delete({ name: "sb-refresh-token", path: "/" }); // Eliminar la cookie del token de refresco

    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false });
  }
}
