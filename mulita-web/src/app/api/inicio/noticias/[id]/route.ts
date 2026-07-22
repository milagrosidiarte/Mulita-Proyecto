import { NextResponse, NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

// PATCH: actualizar noticia para mostrarla en el inicio
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const access_token = req.cookies.get("sb-access-token")?.value;

  if (!access_token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Obtener usuario
  const { data: { user } } = await supabase.auth.getUser(access_token);
  if (!user) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  // Verificar rol
  const { data: usuario } = await supabase
    .from("usuario")
    .select("rol")
    .eq("id", user.id)
    .single();

  if (!usuario || (usuario.rol !== "admin" && usuario.rol !== "superAdmin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // Obtener valor actual
  const { data: noticiaActual, error: fetchError } = await supabase
    .from("noticia")
    .select("mostrar_en_inicio") // Solo necesitamos el campo mostrar_en_inicio
    .eq("id", params.id) // Filtrar por la noticia especificada
    .single();

  if (fetchError || !noticiaActual) {
    return NextResponse.json({ error: "No se encontró la noticia" }, { status: 404 });
  }

  // Invertir valor actual
  const nuevoValor = !noticiaActual.mostrar_en_inicio;

  // Actualizar la noticia
  const { data, error } = await supabase
    .from("noticia")
    .update({ mostrar_en_inicio: nuevoValor })
    .eq("id", params.id)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  console.log(`Noticia ${params.id} actualizada -> mostrar_en_inicio: ${nuevoValor}`);
  console.log("data: ", data);

  return NextResponse.json(data);
}
