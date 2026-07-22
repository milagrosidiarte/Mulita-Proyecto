import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

// GET: Devuelve todas las noticias destacadas para la página de inicio
export async function GET() {
  const { data, error } = await supabase
    .from("noticia")
    .select("*")
    .eq("mostrar_en_inicio", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al obtener noticias destacadas:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
