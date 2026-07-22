import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: Devuelve todos los productos destacados para la página de inicio
export async function GET() {
  const { data, error } = await supabase
    .from("producto")
    .select(`
      *,
      producto_archivos (archivo_url)
      `)
    .eq("mostrar_en_inicio", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al obtener productos destacados:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}
