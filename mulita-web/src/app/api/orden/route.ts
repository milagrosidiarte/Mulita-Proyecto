import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
// GET: Devuelve todas las órdenes de compra de un usuario específico
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { usuario_id, datos_fiscales_id, items, ubicacion, lat, lon, total } = body;
    console.log("items", items);

    if (!usuario_id || !datos_fiscales_id || !items?.length || !total) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios." },
        { status: 400 }
      );
    }

    if (!ubicacion) {
      return NextResponse.json(
        { error: "La ubicación es obligatoria." },
        { status: 400 }
      );
    }

    if (!lat || !lon) {
      return NextResponse.json(
        { error: "Las coordenadas son obligatorias." },
        { status: 400 }
      );
    }

    // Verificar usuario
    const { data: user } = await supabase
      .from("usuario")
      .select("*")
      .eq("id", usuario_id)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: "El usuario no existe." },
        { status: 404 }
      );
    }

    // Verificar datos fiscales
    const { data: fiscal } = await supabase
      .from("datos_fiscales")
      .select("*")
      .eq("id", datos_fiscales_id)
      .single();

    if (!fiscal) {
      return NextResponse.json(
        { error: "Datos fiscales no encontrados." },
        { status: 404 }
      );
    }

    // Crear orden
    const { data: orden, error: ordenError } = await supabase
      .from("orden_compra")
      .insert({
        usuario_id,
        datos_fiscales_id,
        total,
        direccion: ubicacion,
        latitud: lat,
        longitud: lon,
      })
      .select()
      .single();

    if (ordenError || !orden) {
      return NextResponse.json(
        { error: "Error al crear la orden." },
        { status: 500 }
      );
    }

    // Guardar items de la orden
    const itemsPayload = items.map((item: any) => ({
      orden_id: orden.id,
      producto_id: item.producto_id,
      nombre: item.nombre,
      cantidad: item.cantidad,
      precio_unitario: item.precio_unitario,
    }));

    const { error: itemsError } = await supabase
      .from("orden_items")
      .insert(itemsPayload);

    if (itemsError) {
      return NextResponse.json(
        { error: "Orden creada, pero error al guardar los items.", itemsError },
        { status: 500 },
      );
    }

    console.log("ordenBack", orden);
    console.log("itemsBack", items);

    return NextResponse.json(
      {
        message: "Orden creada con éxito",
        orden,
        items,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("ERROR /api/orden:", error);
    return NextResponse.json(
      { error: "Error interno." },
      { status: 500 }
    );
  }
}
