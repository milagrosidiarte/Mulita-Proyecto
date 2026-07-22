import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: Devuelve la cantidad de likes (usuarios que tienen la actividad en favoritos) para una actividad específica
export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const actividadId = params.id;

  try {
    // Contar usuarios únicos que tienen esta actividad en alguna colección (favoritos)
    // Esto se hace buscando en coleccion_actividad donde actividad_id = actividadId
    const { data: likes, error } = await supabase
      .from("coleccion_actividad")
      .select("coleccion_id", { count: "exact" }) // Contar registros exactos
      .eq("actividad_id", actividadId); // Filtrar por la actividad especificada

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // El count exact nos da el número total de registros
    const likeCount = likes?.length || 0;

    return NextResponse.json({ count: likeCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
