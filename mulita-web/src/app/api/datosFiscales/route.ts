import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

// GET: Devuelve los datos fiscales del usuario autenticado
export async function GET(req: Request) {
  // Obtenemos el id del usuario desde el header (no desde cookie/token en este endpoint)
  const userId = req.headers.get("x-user-id");

  // Buscamos el registro de datos fiscales asociado a ese usuario
  const { data, error } = await supabase
    .from("datos_fiscales")
    .select("*")
    .eq("usuario_id", userId)
    .single();

  // Si no existe el registro o hubo un error en la consulta, devolvemos 404
  if (!data || error) {
    return NextResponse.json(
      { error: "Datos fiscales no encontrados." },
      { status: 404 }
    );
  }

  return Response.json({ datosFiscales: data ?? null });
}

// POST: Crea los datos fiscales del usuario
export async function POST(req: Request) {
  // Extraemos del body los datos fiscales a crear
  const body = await req.json();

  const { razon_social, cuit_cuil, usuario_id } = body;
  console.log("razon social", razon_social); // Log de depuración

  // Insertamos el nuevo registro de datos fiscales y devolvemos el creado
  const { data, error } = await supabase
    .from("datos_fiscales")
    .insert([{ razon_social, cuit_cuil, usuario_id }])
    .select()
    .single();

  // Si falla la inserción, lo registramos en consola (no se corta la ejecución)
  if (!data || error) console.log("error creando datos fiscales", error)

  return Response.json({ datosFiscales: data });
}

// PATCH: Edita los datos fiscales existentes
export async function PATCH(req: Request) {
  // Extraemos del body el id y los campos a actualizar
  const body = await req.json();
  const { id, razon_social, cuit_cuil } = body;
  console.log("razon_social editar", razon_social) // Log de depuración

  // Actualizamos el registro de datos fiscales indicado por id, junto con la fecha de actualización
  const { data } = await supabase
    .from("datos_fiscales")
    .update({
      razon_social,
      cuit_cuil,
      updated_at: new Date()
    })
    .eq("id", id)
    .select()
    .single();

  return Response.json({ datosFiscales: data });
}