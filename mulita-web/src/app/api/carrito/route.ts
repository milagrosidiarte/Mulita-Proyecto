import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { cookies } from "next/headers";

// Obtener el carrito actual del usuario
export async function GET(req: NextRequest) {
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

    // Obtener o crear carrito
    let { data: carrito, error: carritoError } = await supabaseServer
      .from("carritos")
      .select("*")
      .eq("usuario_id", userId)
      .single();

    if (carritoError && carritoError.code !== "PGRST116") {
      throw carritoError;
    }

    if (!carrito) { // Si no existe un carrito, devolver un carrito vacío
      return NextResponse.json({ carrito: null, items: [] }, { status: 200 });
    }

    // Obtener items del carrito con datos del producto (ordenados por más recientes primero)
    const { data: items, error: itemsError } = await supabaseServer
      .from("carrito_items")
      .select("*")
      .eq("carrito_id", carrito.id)
      .order("id", { ascending: false });

    if (itemsError) throw itemsError;

    // Obtener datos de productos para cada item
    let itemsConProducto = [];
    if (items && items.length > 0) {
      const productoIds = items.map(item => item.producto_id);
      console.log("Buscando productos con IDs:", productoIds);
      
      // Obtener los productos correspondientes a los items del carrito
      const { data: productos, error: productosError } = await supabaseServer
        .from("producto")
        .select(`
          *,
          producto_archivos (archivo_url, nombre)
        `)
        .in("id", productoIds);

      console.log("Productos encontrados:", productos);
      console.log("Error de productos:", productosError);

      // Mapear cada item del carrito para agregarle los datos del producto correspondiente
      itemsConProducto = items.map(item => {
        const producto = productos?.find(p => p.id === item.producto_id);
        const imagenUrl = producto?.producto_archivos?.[0]?.archivo_url || null;
        
        // Devolver el item del carrito con los datos del producto correspondiente (si existe)
        return {
          ...item,
          producto: producto ? {
            id: producto.id,
            nombre: producto.nombre || producto.titulo || `Producto ${producto.id?.slice(0, 8)}`,
            descripcion: producto.descripcion,
            imagen: imagenUrl,
            precio: producto.precio
          } : null
        };
      });
    }

    // Devolver el carrito y los items con datos de productos
    return NextResponse.json({
      carrito,
      items: itemsConProducto,
    });
  } catch (error) {
    console.error("Error en GET /api/carrito:", error);
    return NextResponse.json(
      { error: "Error al obtener carrito" },
      { status: 500 }
    );
  }
}


// Agregar item al carrito POST
export async function POST(req: NextRequest) {
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

    const userId = user.id; // Obtener el ID del usuario autenticado

    // Obtener los datos del item a agregar al carrito desde el cuerpo de la solicitud
    const { producto_id, cantidad, precio } = await req.json();

    // Validar que se reciban los datos necesarios
    if (!producto_id || !cantidad || !precio) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    // Obtener o crear carrito
    let { data: carrito, error: carritoError } = await supabaseServer
      .from("carritos")
      .select("*")
      .eq("usuario_id", userId)
      .single();

    if (carritoError && carritoError.code !== "PGRST116") {
      throw carritoError;
    }

    console.log("POST - Carrito encontrado:", carrito?.id);

    // Si no existe un carrito, crear uno nuevo
    if (!carrito) {
      console.log("POST - Creando carrito para usuario:", userId);
      const { data: nuevoCarrito, error: crearError } = await supabaseServer
        .from("carritos")
        .upsert(
          [{ usuario_id: userId, total: 0, cantidad_items: 0 }],
          { onConflict: "usuario_id" }
        )
        .select()
        .single();

      if (crearError) {
        console.log("POST - Error al crear carrito:", crearError);
        throw crearError;
      }
      console.log("POST - Carrito creado:", nuevoCarrito?.id);
      carrito = nuevoCarrito;
    }

    // Verificar si el item ya existe en el carrito
    const { data: existingItem } = await supabaseServer
      .from("carrito_items")
      .select("*")
      .eq("carrito_id", carrito.id)
      .eq("producto_id", producto_id)
      .single();

    if (existingItem) {
      // Actualizar cantidad
      const { error: updateError } = await supabaseServer
        .from("carrito_items")
        .update({ cantidad: existingItem.cantidad + cantidad }) // 
        .eq("id", existingItem.id); // Actualizar la cantidad sumando la nueva cantidad a la existente

      if (updateError) throw updateError;
    } else {
      // Insertar nuevo item
      const { error: insertError } = await supabaseServer
        .from("carrito_items")
        .insert([
          {
            carrito_id: carrito.id,
            producto_id,
            cantidad,
            precio,
          },
        ]);

      if (insertError) throw insertError;
    }

    // Actualizar total y cantidad de items del carrito
    const { data: items } = await supabaseServer
      .from("carrito_items")
      .select("*")
      .eq("carrito_id", carrito.id)
      .order("id", { ascending: false });

    const newTotal =
      items?.reduce((sum, item) => sum + item.precio * item.cantidad, 0) || 0;
    const newCantidad = items?.reduce((sum, item) => sum + item.cantidad, 0) || 0;

    // Actualizar total y cantidad de items en el carrito
    await supabaseServer
      .from("carritos")
      .update({
        total: newTotal,
        cantidad_items: newCantidad,
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", carrito.id);

    // Obtener datos de productos para cada item (igual que en GET)
    let itemsConProducto = [];
    if (items && items.length > 0) {
      const productoIds = items.map(item => item.producto_id);
      
      const { data: productos, error: productosError } = await supabaseServer
        .from("producto")
        .select(`
          *,
          producto_archivos (archivo_url, nombre)
        `)
        .in("id", productoIds);

      // Mapear cada item del carrito para agregarle los datos del producto correspondiente
      itemsConProducto = items.map(item => {
        const producto = productos?.find(p => p.id === item.producto_id);
        const imagenUrl = producto?.producto_archivos?.[0]?.archivo_url || null;
        
        // Devolver el item del carrito con los datos del producto correspondiente (si existe)
        return {
          ...item,
          producto: producto ? {
            id: producto.id,
            nombre: producto.nombre || producto.titulo || `Producto ${producto.id?.slice(0, 8)}`,
            descripcion: producto.descripcion,
            imagen: imagenUrl,
            precio: producto.precio
          } : null
        };
      });
    }

    return NextResponse.json({ 
      success: true,
      carrito,
      items: itemsConProducto
    });
  } catch (error) {
    console.error("Error en POST /api/carrito:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: `Error al agregar item al carrito: ${errorMessage}` },
      { status: 500 }
    );
  }
}

// Vaciar carrito
export async function DELETE(req: NextRequest) {
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

    const { data: carrito } = await supabaseServer
      .from("carritos")
      .select("*")
      .eq("usuario_id", userId)
      .single();

    if (!carrito) {
      return NextResponse.json(
        { error: "Carrito no encontrado" },
        { status: 404 }
      );
    }

    // Eliminar todos los items
    await supabaseServer
      .from("carrito_items")
      .delete()
      .eq("carrito_id", carrito.id);

    // Actualizar carrito
    await supabaseServer
      .from("carritos")
      .update({
        total: 0,
        cantidad_items: 0,
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", carrito.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en DELETE /api/carrito:", error);
    return NextResponse.json(
      { error: "Error al vaciar carrito" },
      { status: 500 }
    );
  }
}
