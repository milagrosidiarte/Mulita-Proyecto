import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: Devuelve todas las secciones de la página de sobre nosotros ordenadas por el campo "orden"
export async function GET() {
  const { data, error } = await supabase
    .from("secciones_sobrenosotros")
    .select("*")
    .order("orden", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ secciones: data });
}
