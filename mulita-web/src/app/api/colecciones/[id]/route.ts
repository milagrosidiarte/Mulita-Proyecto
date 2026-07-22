import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: Devuelve una colección con todas sus actividades, incluyendo usuario y perfil
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params; // Obtener el ID de la colección desde los parámetros de la ruta
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

  // Obtener la colección
  const { data: coleccion, error: coleccionError } = await supabase
    .from("coleccion")
    .select("*")
    .eq("id", params.id)
    .eq("eliminado", false) // Asegurarse de que la colección no esté marcada como eliminada
    .single();

  if (coleccionError) return NextResponse.json({ error: coleccionError.message }, { status: 404 });

  // Obtener los IDs de las actividades de la colección
  const { data: coleccionActividad, error: caError } = await supabase
    .from("coleccion_actividad")
    .select("actividad_id")
    .eq("coleccion_id", params.id);

  if (caError) return NextResponse.json({ error: caError.message }, { status: 500 });

  // Extraer los IDs de las actividades
  const actividadIds = coleccionActividad.map((c: any) => c.actividad_id); // mapear los IDs de las actividades de la colección
  if (actividadIds.length === 0) return NextResponse.json({ ...coleccion, actividades: [] }); // Si no hay actividades, devolver la colección con un array vacío

  // Traer actividades
  const { data: actividades, error: actError } = await supabase
    .from("actividad")
    .select(`
      *,
      actividad_archivos (archivo_url, tipo, nombre),
      actividad_categoria (categoria (id, nombre))
      `)
    .in("id", actividadIds)
    .eq("eliminado", false)
    .order("created_at", { ascending: false });

  if (actError) return NextResponse.json({ error: actError.message }, { status: 500 });

  // Traer usuarios y perfiles por separado
  const usuarioIds = [...new Set(actividades.map((a: any) => a.usuario_id))]; // Obtener IDs únicos de usuarios de las actividades

  // Traer usuarios y perfiles
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

  // Combinar usuarios y perfiles con las actividades
  const actividadesConUsuario = actividades.map((act: any) => {
    const usuario = usuarios.find((u) => u.id === act.usuario_id) || {}; // Buscar el usuario correspondiente a la actividad
    const perfil = perfiles.find((p) => p.id === act.usuario_id) || {}; // Buscar el perfil correspondiente al usuario de la actividad
    return { ...act, usuario: { ...usuario, perfil } }; // Devolver la actividad con los datos del usuario y perfil correspondientes
  });

  return NextResponse.json({ ...coleccion, actividades: actividadesConUsuario });
}

// POST: agrega una actividad a una colección (tabla intermedia)
export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  const access_token = req.cookies.get("sb-access-token")?.value;
  if (!access_token)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: { user }, error: userError } = await supabase.auth.getUser(access_token);
  if (userError || !user)
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const { actividadIds } = await req.json();

  if (!actividadIds || actividadIds.length === 0)
    return NextResponse.json({ error: "Debe incluir al menos una actividad" }, { status: 400 });

  // Aceptar tanto un número único como un array
  const ids = Array.isArray(actividadIds) ? actividadIds : [actividadIds];

  const insertData = ids.map((actividadId: string) => ({
    coleccion_id: params.id,
    actividad_id: actividadId,
  }));

  const { error } = await supabase
    .from("coleccion_actividad") // Tabla intermedia
    .upsert(insertData, { onConflict: "coleccion_id, actividad_id" }); // Evitar duplicados

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

// PATCH: Edita el nombre de una colección.
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  const access_token = req.cookies.get("sb-access-token")?.value;
  if (!access_token)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // Obtener usuario autenticado
  const { data: { user }, error: userError } = await supabase.auth.getUser(access_token);
  if (userError || !user)
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const { nombre } = await req.json();
  if (!nombre)
    return NextResponse.json({ error: "El nombre es obligatorio" }, { status: 400 });

  const { data, error } = await supabase
    .from("coleccion")
    .update({ nombre })
    .eq("id", params.id)
    .eq("usuario_id", user?.id)
    .eq("eliminado", false)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}

// DELETE: Soft delete: marca la colección como eliminada
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  const access_token = req.cookies.get("sb-access-token")?.value;
  if (!access_token)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // Obtener usuario autenticado
  const { data: { user }, error: userError } = await supabase.auth.getUser(access_token);
  if (userError || !user)
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  // Obtener la colección para verificar que no sea favoritos
  const { data: coleccion, error: coleccionError } = await supabase
    .from("coleccion")
    .select("tipo")
    .eq("id", params.id)
    .eq("usuario_id", user.id)
    .single();

  if (coleccionError || !coleccion)
    return NextResponse.json({ error: "Colección no encontrada" }, { status: 404 });

  // Validar que no sea la colección de favoritos
  if (coleccion.tipo === "favoritos")
    return NextResponse.json({ error: "No puedes eliminar la carpeta de Favoritos" }, { status: 403 });

  const { error } = await supabase
    .from("coleccion")
    .update({ eliminado: true })
    .eq("id", params.id)
    .eq("usuario_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ message: "Colección eliminada correctamente" });
}
