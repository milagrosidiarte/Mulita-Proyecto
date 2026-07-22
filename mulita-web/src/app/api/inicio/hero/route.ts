import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: obtener el hero actual
export async function GET() {
  // Traemos el registro de hero más reciente (mayor id)
  const { data, error } = await supabase
    .from("hero")
    .select("*")
    .order("id", { ascending: false })
    .limit(1)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH: actualizar
export async function PATCH(req: NextRequest) {
  // Leemos el token de acceso desde la cookie
  const access_token = req.cookies.get("sb-access-token")?.value;
  if (!access_token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // Validamos el token contra Supabase para obtener el usuario
  const { data: { user } } = await supabase.auth.getUser(access_token);
  if (!user) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  // Solo usuarios con rol admin o superAdmin pueden modificar el hero
  const { data: usuario } = await supabase
    .from("usuario")
    .select("rol")
    .eq("id", user.id)
    .single();

  if (!usuario || (usuario.rol !== "admin" && usuario.rol !== "superAdmin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

   // Obtener id_seccion desde la tabla seccion
  // Buscamos el id de la sección "Hero" en secciones_inicio, para vincular el registro correctamente
  const { data: seccion, error: seccionError } = await supabase
    .from("secciones_inicio")
    .select("id") // Solo necesitamos el id de la sección
    .eq("nombre", "Hero") // Filtrar por el nombre de la sección
    .single();

  // Si no se pudo obtener la sección, no podemos continuar (id_seccion es requerido)
  if (seccionError || !seccion) {
    console.error("Error obteniendo id_seccion:", seccionError?.message);
    return NextResponse.json(
      { error: "No se pudo obtener id_seccion para 'hero'" },
      { status: 500 }
    );
  }

  const id_seccion = seccion.id;
  console.log("id_seccion obtenido desde DB:", id_seccion); // Log de depuración

  // Extraemos del body los datos a actualizar
  const body = await req.json();
  const { titulo, descripcion, imagen } = body;

  let imagen_url;

 // Obtener imagen actual
  // Traemos la imagen actual del hero (id fijo = 1), por si no se envía una nueva
  const { data: heroActual } = await supabase
    .from("hero")
    .select("imagen")
    .eq("id", 1)
    .single();

  // Si no llega una imagen nueva (null), conservamos la que ya estaba guardada
  if (imagen === null) {
    imagen_url = heroActual?.imagen;
  } else {
    imagen_url = imagen
  }
  
  console.log("imagen_url:", imagen_url); // Log de depuración

  // Insertamos o actualizamos (id fijo = 1) el registro del hero con los nuevos datos
  const { data, error } = await supabase
    .from("hero")
    .upsert({
      id: 1,
      titulo,
      descripcion,
      imagen: imagen_url,
      id_usuario: user.id,
      id_seccion,
      fecha_modificacion: new Date(),
    })
    .select()
    .single();

  console.log("data:", data); // Log de depuración

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}