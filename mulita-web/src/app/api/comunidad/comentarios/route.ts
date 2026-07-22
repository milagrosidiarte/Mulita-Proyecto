import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: Devuelve todos los comentarios de una actividad específica
export async function POST(req: NextRequest) {
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

  try {
    const { actividad_id, contenido } = await req.json();

    if (!actividad_id || !contenido) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Insertar comentario
    const { data, error } = await supabase
      .from("comentario")
      .insert([
        {
          actividad_id,
          usuario_id: user.id,
          contenido,
          fecha: new Date().toISOString(),
        },
      ])
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
