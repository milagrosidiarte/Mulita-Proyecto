import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  // Obtener la documentación principal
  // Traemos el primer registro de documentación (se asume que hay uno "principal")
  const { data: docu, error } = await supabase
    .from("documentacion")
    .select("*")
    .order("id", { ascending: true })
    .limit(1)
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Obtener documentos asociados
  // Traemos todos los documentos vinculados a esa documentación principal
  const { data: items, error: itemsError } = await supabase
    .from("documentos")
    .select("*")
    .eq("id_documentacion", docu.id)
    .order("id", { ascending: true });

  if (itemsError)
    return NextResponse.json({ error: itemsError.message }, { status: 500 });

  // Devolvemos la documentación junto con su lista de documentos asociados
  return NextResponse.json({ ...docu, documentos: items });
}

// PATCH: Actualizar la documentación principal y sus documentos asociados
export async function PATCH(req: NextRequest) {
  // AUTENTICACIÓN
  // Leemos el token de acceso desde la cookie
  const access_token = req.cookies.get("sb-access-token")?.value;
  if (!access_token)
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // Validamos el token contra Supabase para obtener el usuario
  const {
    data: { user },
  } = await supabase.auth.getUser(access_token);

  // Si el token no corresponde a ningún usuario, lo rechazamos
  if (!user)
    return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  // Validar rol
  // Solo usuarios con rol admin o superAdmin pueden modificar la documentación
  const { data: usuario } = await supabase
    .from("usuario")
    .select("rol")
    .eq("id", user.id)
    .single();

  if (!usuario || (usuario.rol !== "admin" && usuario.rol !== "superAdmin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  // BODY
  // Extraemos del body los datos de la documentación y sus documentos asociados
  const body = await req.json();
  const { titulo, descripcion, documentos } = body;

  console.log("documentos", documentos); // Log de depuración

  // Validamos que estén los campos obligatorios y que documentos sea un array
  if (!titulo || !descripcion || !Array.isArray(documentos)) {
    return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
  }

  // UPSERT DOCUMENTACION
  // Insertamos o actualizamos (id fijo = 1) el registro principal de documentación
  const { data: docuData, error: docuError } = await supabase
    .from("documentacion")
    .upsert({
      id: 1,
      titulo,
      descripcion,
      id_usuario: user.id,
      fecha_modificacion: new Date(),
      id_seccion: 4,
    })
    .select()
    .single();

  if (docuError || !docuData)
    return NextResponse.json(
      { error: docuError?.message || "Error al guardar" },
      { status: 500 }
    );

  const id_documentacion = docuData.id;

  // LIMPIAR DOCUMENTOS ANTERIORES
  // Borramos todos los documentos previamente asociados, para reemplazarlos por los nuevos
  await supabase.from("documentos").delete().eq("id_documentacion", id_documentacion);

  // INSERTAR DOCUMENTOS NUEVOS
  // Armamos el array de documentos a insertar, con valores por defecto para campos opcionales
  const docsInsert = documentos.map((doc: any) => ({
    id_documentacion,
    tipo: doc.tipo,
    url: doc.url || "",
    descripcion: doc.descripcion ?? "",
    nombre: doc.nombre ?? "",
  }));

  // Insertamos todos los documentos nuevos de una sola vez
  const { error: insertError } = await supabase
    .from("documentos")
    .insert(docsInsert);

  if (insertError)
    return NextResponse.json({ error: insertError.message }, { status: 500 });

  // Devolvemos la documentación actualizada junto con los documentos recién insertados
  return NextResponse.json({ ...docuData, documentos: docsInsert });
}