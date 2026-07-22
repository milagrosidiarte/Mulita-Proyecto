import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { cookies } from "next/headers";

// Función auxiliar para obtener items con datos de productos (ordenados por más recientes primero)
async function getItemsWithProducts(carritoId: string) {
  const { data: items } = await supabaseServer
    .from("carrito_items")
    .select("*")
    .eq("carrito_id", carritoId)
    .order("id", { ascending: false });

  // Unir los datos de los productos con los items del carrito
  let itemsConProducto = [];
  if (items && items.length > 0) {
    // Obtener los IDs de los productos de los items del carrito
    const productoIds = items.map(item => item.producto_id); // Obtener los IDs de los productos de los items del carrito
    
    const { data: productos } = await supabaseServer 
      .from("producto")
      .select(`
        *,
        producto_archivos (archivo_url, nombre)
      `)
      .in("id", productoIds);

    itemsConProducto = items.map(item => { // Mapear cada item del carrito para agregarle los datos del producto correspondiente
      const producto = productos?.find(p => p.id === item.producto_id); // Buscar el producto correspondiente al item del carrito
      const imagenUrl = producto?.producto_archivos?.[0]?.archivo_url || null; // Obtener la URL de la imagen del producto (si existe) o null si no hay imagen
      
      return {
        ...item,
        producto: producto ? {
          id: producto.id,
          nombre: producto.nombre || producto.titulo || `Producto ${producto.id?.slice(0, 8)}`, // Usar nombre, título o un identificador parcial si no hay nombre
          descripcion: producto.descripcion,
          imagen: imagenUrl,
          precio: producto.precio
        } : null
      };
    });
  }

  return itemsConProducto; // Devolver los items del carrito con los datos de los productos correspondientes
}

// Actualizar cantidad o eliminar item del carrito PUT 
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // Recibir el parámetro id del item del carrito desde la URL
) { 
  try {
    const cookieStore = await cookies();
    const access_token = cookieStore.get("sb-access-token")?.value; // Obtener el token de acceso de Supabase desde las cookies

    if (!access_token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener usuario de Supabase usando el token
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser(access_token);
    
    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = user.id;

    const { cantidad } = await req.json(); // Obtener la nueva cantidad del item del carrito desde el cuerpo de la solicitud
    const resolvedParams = await params; // Resolver los parámetros de la URL para obtener el id del item del carrito
    const itemId = resolvedParams.id; // Obtener el id del item del carrito desde los parámetros de la URL

    // Validar cantidad
    if (!cantidad || cantidad < 1) {
      return NextResponse.json(
        { error: "Cantidad inválida" },
        { status: 400 }
      );
    }

    // Verificar que el item pertenezca al usuario
    const { data: item } = await supabaseServer
      .from("carrito_items")
      .select(
        `
        *,
        carrito:carritos(usuario_id)
      `
      )
      .eq("id", itemId)
      .single();

    // Validar que el item exista y que pertenezca al usuario
    if (!item || item.carrito.usuario_id !== userId) {
      return NextResponse.json(
        { error: "Item no encontrado" },
        { status: 404 }
      );
    }

    // Actualizar cantidad
    const { error: updateError } = await supabaseServer
      .from("carrito_items")
      .update({ cantidad })
      .eq("id", itemId);

    if (updateError) throw updateError;

    // Recalcular total del carrito
    const { data: items } = await supabaseServer
      .from("carrito_items")
      .select("*")
      .eq("carrito_id", item.carrito_id);

    const newTotal =
      items?.reduce((sum, i) => sum + i.precio * i.cantidad, 0) || 0;
    const newCantidad = items?.reduce((sum, i) => sum + i.cantidad, 0) || 0;

    // Actualizar total y cantidad de items en el carrito
    await supabaseServer
      .from("carritos")
      .update({
        total: newTotal,
        cantidad_items: newCantidad,
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", item.carrito_id);

    // Obtener items con productos
    const itemsConProducto = await getItemsWithProducts(item.carrito_id);

    return NextResponse.json({ 
      success: true,
      items: itemsConProducto
    });
  } catch (error) {
    console.error("Error en PUT /api/carrito/[id]:", error);
    return NextResponse.json(
      { error: "Error al actualizar item" },
      { status: 500 }
    );
  }
}

// Eliminar item del carrito
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const access_token = cookieStore.get("sb-access-token")?.value;

    if (!access_token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener usuario de Supabase usando el token
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser(access_token);
    
    if (userError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const userId = user.id;

    const resolvedParams = await params;
    const itemId = resolvedParams.id;

    // Verificar que el item pertenezca al usuario
    const { data: item } = await supabaseServer
      .from("carrito_items")
      .select(
        `
        *,
        carrito:carritos(usuario_id)
      `
      )
      .eq("id", itemId)
      .single();

    // Validar que el item exista y que pertenezca al usuario
    if (!item || item.carrito.usuario_id !== userId) {
      return NextResponse.json(
        { error: "Item no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar item
    const { error: deleteError } = await supabaseServer
      .from("carrito_items")
      .delete()
      .eq("id", itemId);

    if (deleteError) throw deleteError;

    // Recalcular total del carrito
    const { data: items } = await supabaseServer
      .from("carrito_items")
      .select("*")
      .eq("carrito_id", item.carrito_id);

    const newTotal =
      items?.reduce((sum, i) => sum + i.precio * i.cantidad, 0) || 0;
    const newCantidad = items?.reduce((sum, i) => sum + i.cantidad, 0) || 0;

    await supabaseServer
      .from("carritos")
      .update({
        total: newTotal,
        cantidad_items: newCantidad,
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", item.carrito_id);

    // Obtener items con productos
    const itemsConProducto = await getItemsWithProducts(item.carrito_id);

    return NextResponse.json({ 
      success: true,
      items: itemsConProducto
    });
  } catch (error) {
    console.error("Error en DELETE /api/carrito/[id]:", error);
    return NextResponse.json(
      { error: "Error al eliminar item" },
      { status: 500 }
    );
  }
}
