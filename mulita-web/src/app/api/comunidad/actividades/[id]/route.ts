import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: Devuelve la cantidad de likes (usuarios que tienen la actividad en favoritos) para una actividad específica
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params; // Obtener los parámetros de la ruta

  const access_token = req.cookies.get("sb-access-token")?.value;
  if (!access_token)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // Obtener usuario autenticado
  const { data: { user }, error: userError } = await supabase.auth.getUser(access_token);
  if (userError || !user)
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  // Obtener actividad con usuario, archivos y categorías
  const { data: actividad, error: actividadError } = await supabase
    .from("actividad")
    .select(`
      *,
      actividad_archivos (archivo_url, tipo, nombre),
      actividad_categoria (categoria_id, categoria(nombre))
    `)
    .eq("id", params.id)
    .eq("eliminado", false)
    .single();

    console.log("ID solicitado:", params.id);
    console.log("Actividad de Supabase:", actividad);
    console.log("Error de Supabase:", actividadError);

  if (actividadError || !actividad)
    return NextResponse.json({ error: "Actividad no encontrada" }, { status: 404 });

  // Extraer los IDs de categorías
  const categorias_ids = actividad.actividad_categoria?.map(
    (ac: any) => ac.categoria_id // Extraer solo el ID de la categoría
  ) || [];

  console.log("IDs de categorías:", categorias_ids); // Imprimir los IDs de categorías

  // Transformar la respuesta para el frontend
  const respuesta = {
    ...actividad, // Incluir todos los campos de la actividad
    categorias_ids, // Incluir los IDs de categorías
  };

  return NextResponse.json(respuesta);
}

// PATCH: Actualiza una actividad específica
export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const { id } = params;

  // Autenticación
  const access_token = req.cookies.get("sb-access-token")?.value;
  if (!access_token)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const {
    data: { user }, // Obtener el usuario autenticado
    error: userError,
  } = await supabase.auth.getUser(access_token); 

  if (userError || !user)
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const body = await req.json();
  const { titulo, descripcion, categorias, archivosNuevos, archivosExistentes } = body;

  // Obtener la actividad
  const { data: actividad, error: actError } = await supabase
    .from("actividad")
    .select("usuario_id")
    .eq("id", id) // Filtrar por la actividad especificada
    .single();

  if (actError || !actividad)
    return NextResponse.json(
      { error: "Actividad no encontrada" },
      { status: 404 }
    );

  // Verificar permisos
  if (actividad.usuario_id !== user.id)
    return NextResponse.json(
      { error: "No tienes permisos para editar esta actividad" },
      { status: 403 }
    );

  // Actualizar actividad
  const { data, error: actividadError } = await supabase
    .from("actividad")
    .update({ titulo, descripcion })
    .eq("id", id)
    .select()
    .single();

  if (actividadError)
    return NextResponse.json(
      { error: actividadError.message },
      { status: 400 }
    );

  // Actualizar archivos
  // Obtener los archivos actuales de la actividad
  const { data: archivosActuales } = await supabase
    .from("actividad_archivos")
    .select("archivo_url")
    .eq("actividad_id", id);

  const actualesUrls = archivosActuales?.map((a) => a.archivo_url) || []; // Obtener solo las URLs de los archivos actuales

  // Determinar cuáles eliminar
  const archivosAEliminar = actualesUrls.filter(
    (url) => !archivosExistentes.includes(url)
  );

  if (archivosAEliminar.length > 0) {
    await supabase
      .from("actividad_archivos")
      .delete()
      .in("archivo_url", archivosAEliminar);
  }

  // Guardar las URLs de los archivos subidos desde el frontend
  if (archivosNuevos && archivosNuevos.length > 0) {
    const { error: insertArchivosError } = await supabase
      .from("actividad_archivos")
      .insert(
        archivosNuevos.map((file: any) => ({
          actividad_id: id,
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

  // Actualizar categorías
  if (categorias.length) {
    await supabase.from("actividad_categoria").delete().eq("actividad_id", id);
    await supabase.from("actividad_categoria").insert(
      categorias.map((categoriaId: string) => ({
        actividad_id: id,
        categoria_id: categoriaId,
      }))
    );
  }

  return NextResponse.json({ message: "Actividad actualizada", data });
}


export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const access_token = req.cookies.get("sb-access-token")?.value;
  if (!access_token)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: { user }, error: userError } = await supabase.auth.getUser(access_token);
  if (userError || !user)
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const { data: usuario } = await supabase.from("usuario").select("rol").eq("id", user.id).single();
  if (!usuario) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // Obtener la actividad
  const { data: actividad, error: actError } = await supabase
    .from("actividad")
    .select("*")
    .eq("id", id)
    .single();

  if (actError || !actividad) return NextResponse.json({ error: "Actividad no encontrada" }, { status: 404 });

  // Comprobar permisos: autor, admin o superAdmin
  if (actividad.usuario_id !== user.id && usuario.rol !== "admin" && usuario.rol !== "superAdmin")
    return NextResponse.json({ error: "No tienes permisos para editar esta actividad" }, { status: 403 });

  // Soft delete
  const { error } = await supabase
    .from("actividad")
    .update({ eliminado: true })
    .eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ message: "Actividad eliminada correctamente" });
}
