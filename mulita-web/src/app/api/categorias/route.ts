import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: listar categorías
export async function GET() {
  const { data, error } = await supabase.from("categoria").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// POST: Crear categoría
export async function POST(req: NextRequest) {
  // Validar autenticación desde cookie
  const token = req.cookies.get("sb-access-token")?.value;
  console.log("Token:", token);

  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  console.log("userData", userData, "userError", userError);

  if (userError || !userData.user) {
    return NextResponse.json({ error: "Usuario inválido" }, { status: 401 });
  }

  // Buscar rol del usuario
  const { data: usuario, error: usuarioError } = await supabase
    .from("usuario")
    .select("rol")
    .eq("id", userData.user.id)
    .single();

  console.log("usuario:", usuario, "usuarioError", usuarioError);

  if (usuarioError || !usuario) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 403 });
  }

  if (usuario.rol !== "admin" && usuario.rol !== "superAdmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { nombre, tipo } = await req.json(); // Obtener nombre y tipo desde el cuerpo de la solicitud

  // Validar que se reciban los datos necesarios
  const { data, error } = await supabase
    .from("categoria")
    .insert({ nombre, tipo })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE: Eliminar categoría
export async function DELETE(req: NextRequest) {
  // Validar autenticación desde cookie
  const token = req.cookies.get("sb-access-token")?.value;
  console.log("Token:", token);

  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  console.log("userData", userData, "userError", userError);

  if (userError || !userData.user) {
    return NextResponse.json({ error: "Usuario inválido" }, { status: 401 });
  }

  // Buscar rol del usuario
  const { data: usuario, error: usuarioError } = await supabase
    .from("usuario")
    .select("rol")
    .eq("id", userData.user.id)
    .single();

  console.log("usuario:", usuario, "usuarioError", usuarioError);

  if (usuarioError || !usuario) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 403 });
  }

  if (usuario.rol !== "admin" && usuario.rol !== "superAdmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { id } = await req.json();

  const { error } = await supabase
  .from("categoria")
  .delete()
  .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Categoría eliminada" });
}
