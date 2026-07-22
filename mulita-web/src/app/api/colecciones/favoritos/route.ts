import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const access_token = req.cookies.get("sb-access-token")?.value;
  if (!access_token)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // Obtener el usuario
  const { data: { user }, error: userError } = await supabase.auth.getUser(access_token);
  if (userError || !user)
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  // Obtener la colección de tipo "favoritos" del usuario
  const { data: coleccionFavoritos, error: coleccionError } = await supabase
    .from("coleccion")
    .select("id")
    .eq("usuario_id", user.id) // Filtrar por el usuario autenticado
    .eq("tipo", "favoritos") // Filtrar por la colección de favoritos
    .single();

  if (coleccionError || !coleccionFavoritos)
    return NextResponse.json([], { status: 200 }); // No hay colección favoritos todavía

  // Obtener las actividades asociadas a esa colección
  const { data: favoritos, error } = await supabase
    .from("coleccion_actividad")
    .select("actividad_id")
    .eq("coleccion_id", coleccionFavoritos.id); // Filtrar por la colección de favoritos del usuario

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(favoritos || []);
}
