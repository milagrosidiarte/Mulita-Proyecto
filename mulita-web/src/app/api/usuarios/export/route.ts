import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.toLowerCase() || "";
  const rol = searchParams.get("rol") || "";

  let query = supabase
    .from("usuario")
    .select(
      `
      id,
      nombre,
      apellido,
      email,
      rol,
      created_at,
      eliminado,
      docente(
        institucion,
        pais,
        provincia,
        ciudad
      )
    `
    )
    .eq("eliminado", false)
    .order("created_at", { ascending: false });

  if (search) {
    query = query.ilike("nombre", `%${search}%`); // Filtrar por nombre (case-insensitive)
  }

  if (rol) {
    query = query.eq("rol", rol); // Filtrar por rol
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transformar los datos para aplanar la estructura de docente
  const usuariosTransformados = data?.map((usuario: any) => ({
    ...usuario,
    pais: usuario.docente?.[0]?.pais || "",
    provincia: usuario.docente?.[0]?.provincia || "",
    ciudad: usuario.docente?.[0]?.ciudad || "",
    institucion: usuario.docente?.[0]?.institucion || "",
  })) || [];

  return NextResponse.json({
    usuarios: usuariosTransformados,
  });
}

