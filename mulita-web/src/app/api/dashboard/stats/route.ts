import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

// GET: Devuelve estadísticas del dashboard
export async function GET(req: NextRequest) {
  try {
    // Obtener fecha hace 30 días
    const treintaDiasAtras = new Date();
    treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);
    const fechaLimite = treintaDiasAtras.toISOString();

    // 1. Total de usuarios y usuarios nuevos (últimos 30 días)
    const { count: totalUsuarios, error: usersError } = await supabaseServer
      .from("usuario")
      .select("*", { count: "exact", head: true })
      .eq("eliminado", false);

    const { count: nuevosUsuarios, error: newUsersError } = await supabaseServer
      .from("usuario")
      .select("*", { count: "exact", head: true })
      .eq("eliminado", false)
      .gte("created_at", fechaLimite);

    // 2. Total de actividades y actividades nuevas (últimos 30 días)
    const { count: totalActividades, error: activitiesError } = await supabaseServer
      .from("actividad")
      .select("*", { count: "exact", head: true })
      .eq("eliminado", false);

    const { count: nuevasActividades, error: newActivitiesError } = await supabaseServer
      .from("actividad")
      .select("*", { count: "exact", head: true })
      .eq("eliminado", false)
      .gte("created_at", fechaLimite);

    // 3. Total de ordenes y ordenes nuevas (últimos 30 días)
    const { count: totalPedidos, error: ordersError } = await supabaseServer
      .from("orden_compra")
      .select("*", { count: "exact", head: true });

    const { count: nuevosPedidos, error: newOrdersError } = await supabaseServer
      .from("orden_compra")
      .select("*", { count: "exact", head: true })
      .gte("created_at", fechaLimite);

    // Verificar errores
    if (usersError) throw usersError;
    if (activitiesError) throw activitiesError;
    if (ordersError) throw ordersError;

    return NextResponse.json({
      success: true,
      stats: {
        usuarios: {
          total: totalUsuarios || 0,
          nuevos: nuevosUsuarios || 0,
        },
        actividades: {
          total: totalActividades || 0,
          nuevas: nuevasActividades || 0,
        },
        pedidos: {
          total: totalPedidos || 0,
          nuevos: nuevosPedidos || 0,
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener stats del dashboard:", error);
    return NextResponse.json(
      { error: "Error al obtener estadísticas", details: String(error) },
      { status: 500 }
    );
  }
}
