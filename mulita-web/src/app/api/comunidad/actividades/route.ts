import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET
export async function GET(req: NextRequest) {
  const access_token = req.cookies.get("sb-access-token")?.value;
  if (!access_token)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(access_token);

  if (userError || !user)
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "5", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);
  const search = searchParams.get("search")?.trim() || "";
  const categorias = searchParams.getAll("categoria").map(c => c.trim()).filter(c => c);
  const fechaFiltro = searchParams.get("fecha")?.trim() || "";

  // --- Construir filtro por categoría ---
  // Ahora es OR: mostrar actividades que tengan AL MENOS una categoría seleccionada
  let actividadIdsFiltradas: string[] | null = null;
  if (categorias.length > 0) {
    const { data: catData, error: catError } = await supabase
      .from("categoria")
      .select("id")
      .in("nombre", categorias);

    if (!catError && catData && catData.length > 0) {
      const categoriaIds = catData.map(c => c.id);
      const { data: actividadCatIds, error: acError } = await supabase
        .from("actividad_categoria")
        .select("actividad_id")
        .in("categoria_id", categoriaIds);

      if (acError) return NextResponse.json({ error: acError.message }, { status: 500 });

      // Obtener actividades únicas que tengan al menos una de las categorías
      actividadIdsFiltradas = [...new Set(actividadCatIds.map((ac) => ac.actividad_id))];
      if (actividadIdsFiltradas.length === 0) return NextResponse.json([], { status: 200 });
    } else {
      return NextResponse.json([], { status: 200 });
    }
  }

  // Construir query principal
  let query = supabase
    .from("actividad")
    .select(`
      *,
      actividad_archivos (archivo_url, tipo, nombre),
      actividad_categoria (categoria(id, nombre))
    `)
    .eq("eliminado", false);

  // Determinar orden según el filtro de fecha
  if (fechaFiltro === "antiguo_nuevo") {
    query = query.order("created_at", { ascending: true });
  } else if (fechaFiltro === "nuevo_antiguo") {
    query = query.order("created_at", { ascending: false });
  } else {
    // Por defecto, más nuevo a más antiguo
    query = query.order("created_at", { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  // Filtro por búsqueda
  if (search) {
    query = query.or(`titulo.ilike.%${search}%,descripcion.ilike.%${search}%`);
  }

  // Filtro por categoría
  if (actividadIdsFiltradas) {
    query = query.in("id", actividadIdsFiltradas);
  }

  //Filtro por fecha (rango temporal)
  if (fechaFiltro && fechaFiltro !== "nuevo_antiguo" && fechaFiltro !== "antiguo_nuevo") {
    const ahora = new Date();
    let startDate: Date;

    switch (fechaFiltro) {
      case "hoy":
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case "semana":
        const dia = ahora.getDay(); // 0 = domingo
        startDate = new Date();
        startDate.setDate(ahora.getDate() - dia);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "mes":
        startDate = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        break;
      default:
        startDate = new Date(0); // sin filtro si valor no reconocido
    }

    query = query.gte("created_at", startDate.toISOString());
  }

  // Ejecutar query
  const { data: actividades, error: actividadError } = await query;
  if (actividadError)
    return NextResponse.json({ error: actividadError.message }, { status: 500 });

  if (!actividades || actividades.length === 0) return NextResponse.json([], { status: 200 });

  // Obtener usuarios y perfiles
  const usuarioIds = [...new Set(actividades.map((a: any) => a.usuario_id))];

  const { data: usuarios, error: usuarioError } = await supabase
    .from("usuario")
    .select("id, nombre, apellido")
    .in("id", usuarioIds);

  const { data: perfiles, error: perfilError } = await supabase
    .from("perfil")
    .select("id, imagen")
    .in("id", usuarioIds);

  if (usuarioError || perfilError)
    return NextResponse.json(
      { error: "Error obteniendo usuarios o perfiles" },
      { status: 500 }
    );

  // Combinar usuarios y perfiles
  const actividadesConUsuario = actividades.map((act: any) => {
    const usuario = usuarios.find((u) => u.id === act.usuario_id) || {};
    const perfil = perfiles.find((p) => p.id === act.usuario_id) || {};
    return { ...act, usuario: { ...usuario, perfil } };
  });

  return NextResponse.json(actividadesConUsuario);
}


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

  // Leer datos JSON
  const body = await req.json();
  const { titulo, descripcion, categorias, archivos } = body;

  // Crear la actividad
  const { data: actividad, error: actividadError } = await supabase
    .from("actividad")
    .insert({
      titulo,
      descripcion,
      fecha: new Date().toISOString(),
      usuario_id: user.id,
    })
    .select()
    .single();

  if (actividadError) {
    console.error("Error creando actividad:", actividadError.message);
    return NextResponse.json({ error: actividadError.message }, { status: 400 });
  }

  // Guardar las URLs de los archivos subidos desde el frontend
  if (archivos && archivos.length > 0) {
    const { error: insertArchivosError } = await supabase
      .from("actividad_archivos")
      .insert(
        archivos.map((file: any) => ({
          actividad_id: actividad.id,
          archivo_url: file.url,
          nombre: file.name,
          tipo: file.type,
        }))
      );

    if (insertArchivosError) {
      console.error("Error guardando archivos:", insertArchivosError.message);
      return NextResponse.json({ error: "Error guardando archivos" }, { status: 500 });
    }
  }

  // Asociar categorías existentes
  if (categorias && categorias.length) {
    const { data: categoriasExistentes, error: catError } = await supabase
      .from("categoria")
      .select("id, nombre")
      .in("id", categorias);

    if (catError) console.error("Error obteniendo categorías:", catError.message);

    if (categoriasExistentes?.length) {
      const { error: insertCategoriasError } = await supabase
        .from("actividad_categoria")
        .insert(
          categoriasExistentes.map((c) => ({
            actividad_id: actividad.id,
            categoria_id: c.id,
          }))
        );

      if (insertCategoriasError)
        console.error("Error asociando categorías:", insertCategoriasError.message);
    }
  }

  return NextResponse.json({
    message: "Actividad creada con éxito",
    actividad,
  });
}
