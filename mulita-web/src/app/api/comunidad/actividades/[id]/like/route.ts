import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST: Agrega una actividad a la colección Favoritos del usuario autenticado
export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params; // Obtener los parámetros de la ruta
  const actividadId = params.id; // ID de la actividad que se quiere agregar a Favoritos

  const access_token = req.cookies.get("sb-access-token")?.value;
  if (!access_token)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: { user }, error: userError } = await supabase.auth.getUser(access_token);
  if (userError || !user)
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  // Obtener colección Favoritos del usuario
  const { data: favoritos, error: favError } = await supabase
    .from("coleccion")
    .select("id")
    .eq("usuario_id", user.id) // Filtrar por el usuario autenticado
    .eq("tipo", "favoritos") // Filtrar por la colección de favoritos
    .single();

  if (favError || !favoritos)
    return NextResponse.json({ error: "No se pudo obtener la colección Favoritos" }, { status: 500 });

  // Insertar relación actividad - colección (upsert evita duplicados)
  const { data, error } = await supabase
    .from("coleccion_actividad")
    .upsert(
      { coleccion_id: favoritos.id, actividad_id: actividadId }, // Insertar la relación entre la colección Favoritos y la actividad
      { onConflict: "coleccion_id,actividad_id" } // Evitar duplicados: si ya existe la relación, no hacer nada
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: "Actividad agregada a Favoritos" });
}

// DELETE: Elimina una actividad de la colección Favoritos del usuario autenticado
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const actividadId = params.id;

  const access_token = req.cookies.get("sb-access-token")?.value;
  if (!access_token)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: { user }, error: userError } = await supabase.auth.getUser(access_token);
  if (userError || !user)
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  // Obtener colección Favoritos del usuario
  const { data: favoritos, error: favError } = await supabase
    .from("coleccion")
    .select("id")
    // Filtrar por el usuario autenticado y la colección de favoritos
    .eq("usuario_id", user.id)
    .eq("tipo", "favoritos")
    .single();

  if (favError || !favoritos)
    return NextResponse.json({ error: "No se encontró la colección Favoritos" }, { status: 404 });

  // Eliminar relación actividad - colección
  const { error } = await supabase
    .from("coleccion_actividad")
    .delete()
    .eq("coleccion_id", favoritos.id) // Filtrar por la colección Favoritos del usuario
    .eq("actividad_id", actividadId); // Filtrar por la actividad que se quiere eliminar de Favoritos

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: "Like removido" });
}
