import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET: obtener los datos de Mision y Vision
export async function GET() {
  const { data, error } = await supabase
    .from("mision_vision")
    .select("*")
    .order("id", { ascending: true })
    .limit(1)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// PATCH: actualizar Mision y Vision
export async function PATCH(req: NextRequest) {
  const access_token = req.cookies.get("sb-access-token")?.value;
  if (!access_token) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data: { user } } = await supabase.auth.getUser(access_token);
  if (!user) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const { data: usuario } = await supabase
    .from("usuario")
    .select("rol")
    .eq("id", user.id)
    .single();

  if (!usuario || (usuario.rol !== "admin" && usuario.rol !== "superAdmin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // Obtener id_seccion desde secciones_sobreNosotros
  const { data: seccion, error: seccionError } = await supabase
    .from("secciones_sobrenosotros")
    .select("id")
    .eq("nombre", "MisionVision")
    .single();

  if (seccionError || !seccion) {
    return NextResponse.json(
      { error: "No se pudo obtener id_seccion para 'MisionVision'" },
      { status: 500 }
    );
  }

  const id_seccion = seccion.id;
  console.log("id_seccion obtenido desde DB:", id_seccion);

  const body = await req.json();
  const { titulo1, titulo2, descripcion1, descripcion2, imagen1, imagen2 } = body;

  let imagen_url1;
  let imagen_url2;

  // Obtener imagen actual
  const { data: misionVisionActual } = await supabase
    .from("mision_vision")
    .select("imagen1, imagen2")
    .eq("id", 1)
    .single();

    // Si la imagen enviada es null, mantenemos la imagen actual; de lo contrario, usamos la nueva imagen
  if (imagen1 === null) {
    imagen_url1 = misionVisionActual?.imagen1;
  } else {
    imagen_url1 = imagen1
  }

  console.log("imagen1_url:", imagen_url1);

  if (imagen2 === null) {
    imagen_url2 = misionVisionActual?.imagen2;
  } else {
    imagen_url2 = imagen2
  }

  console.log("imagen1_url:", imagen_url2);

  // Upsert: si existe, actualiza; si no, inserta
  const { data, error } = await supabase
    .from("mision_vision")
    .upsert({
      id: 1,
      titulo1,
      titulo2,
      descripcion1,
      descripcion2,
      imagen1: imagen_url1,
      imagen2: imagen_url2,
      id_usuario: user.id,
      id_seccion,
      fecha_modificacion: new Date(),
    })
    .select()
    .single();

    console.log("data:", data);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
