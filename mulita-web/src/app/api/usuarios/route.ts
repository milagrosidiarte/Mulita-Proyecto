import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: Devuelve todos los usuarios con paginación, búsqueda y filtrado por rol
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") || 1);
  const limit = Number(searchParams.get("limit") || 10);
  const search = searchParams.get("search")?.toLowerCase() || "";
  const rol = searchParams.get("rol") || "";

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("usuario")
    .select("*", { count: "exact" })
    .eq("eliminado", false)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) {
    query = query.ilike("nombre", `%${search}%`);
  }

  if (rol) {
    query = query.eq("rol", rol);
  }

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    usuarios: data,
    total: count,
    page,
    limit,
  });
}
