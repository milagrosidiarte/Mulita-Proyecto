import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: Devuelve todas las colecciones activas de un usuario
export async function GET(req: NextRequest) {
  const access_token = req.cookies.get("sb-access-token")?.value;
  if (!access_token)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // Obtener usuario autenticado
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(access_token);

  if (userError || !user)
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const usuarioIdQuery = searchParams.get("userId");

  // Determinar el usuario a consultar: propio o de otro perfil
  const usuarioId = usuarioIdQuery || user.id;

  // Obtener colecciones
  const { data, error } = await supabase
    .from("coleccion")
    .select("*")
    .eq("usuario_id", usuarioId)
    .eq("eliminado", false)
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}


// POST: Crea una nueva colección.
export async function POST(req: NextRequest) {
  const access_token = req.cookies.get("sb-access-token")?.value;
  if (!access_token)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(access_token);

  if (userError || !user)
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const { nombre } = await req.json(); // Obtener el nombre de la colección desde el cuerpo de la solicitud

  if (!nombre)
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });

  const { data, error } = await supabase
    .from("coleccion")
    .insert({ nombre, usuario_id: user.id }) // Insertar la nueva colección con el nombre y el ID del usuario autenticado
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
