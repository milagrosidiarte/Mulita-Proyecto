"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useUser } from "@/hooks/queries";
import UserRoleBadge from "@/components/ui/dashboard/UserRoleBadge";

// Definimos la función para la página principal del dashboard, que incluye un resumen de estadísticas y un mensaje de bienvenida al usuario
export default function DashboardPage() {
  const { user, isLoading: userLoading } = useUser(); // Hook personalizado para obtener la información del usuario actual
  const [stats, setStats] = useState({ // Estado inicial de las estadísticas
    usuarios: { total: 0, nuevos: 0 },
    actividades: { total: 0, nuevas: 0 },
    pedidos: { total: 0, nuevos: 0 },
  });
  const [loading, setLoading] = useState(true);

  // Función para obtener las estadísticas desde la API del dashboard
  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats", {
        cache: "no-store",
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error al cargar estadísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Recargar cada 5 segundos para detectar cambios más rápido
    const interval = setInterval(fetchStats, 5 * 1000);
    return () => clearInterval(interval); // Limpiar el intervalo al desmontar el componente
  }, []);

  return (
    <div className="w-full flex flex-col items-center px-4 sm:px-6 lg:px-10 pb-10 text-center text-xs text-[#6d758f] font-inter">
      
      {/* Headings con información del usuario */}
      <div className="w-full max-w-5xl flex flex-col items-start text-[28px] sm:text-[36px]">
        <div className="font-extrabold text-black">Dashboard</div>
        <div className="text-left text-base leading-6 mt-2">
          Resumen del estado actual de la página Mulita
        </div>
      </div>

      {/* Tarjeta de bienvenida con rol del usuario */}
      {!userLoading && user && (
        <div className="w-full max-w-5xl mt-8 bg-gradient-to-r from-[#003C71] to-[#005a9f] rounded-lg p-8 text-white shadow-lg relative">
          <div className="flex flex-col items-center justify-center gap-6 text-center">
            <div>
              <h2 className="text-2xl font-bold mb-2">
                ¡Bienvenido, {user.nombre}!
              </h2>
              <p className="text-blue-100 mb-4">
                Aquí puedes gestionar todos los aspectos de Mulita
              </p>
              <div className="flex justify-center">
                <UserRoleBadge />
              </div>
            </div>
          </div>
          {user.imagen && (
            <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
              <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden flex items-center justify-center">
                <Image
                  src={user.imagen}
                  alt={user.nombre}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid de cards */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-5xl">
        {/* NUEVAS ACTIVIDADES */}
        <Card
          title="Nuevas Actividades"
          value={loading ? "..." : stats.actividades.nuevas.toString()}
          subtitle="en los últimos 30 días"
          color="text-[#68bb6c]"
          icon="/images/icons/dashboard/actividades.svg"
        />

        {/* TOTAL ACTIVIDADES */}
        <Card
          title="Total de Actividades"
          value={loading ? "..." : stats.actividades.total.toString()}
          subtitle="actividades creadas"
          color="text-[#68bb6c]"
          icon="/images/icons/dashboard/actividades.svg"
        />

        {/* NUEVOS USUARIOS */}
        <Card
          title="Nuevos Usuarios"
          value={loading ? "..." : stats.usuarios.nuevos.toString()}
          subtitle="en los últimos 30 días"
          color="text-[#ec9d54]"
          icon="/images/icons/dashboard/usuario.svg"
        />

        {/* TOTAL USUARIOS */}
        <Card
          title="Total de Usuarios"
          value={loading ? "..." : stats.usuarios.total.toString()}
          subtitle="usuarios registrados"
          color="text-[#ec9d54]"
          icon="/images/icons/dashboard/usuario.svg"
        />

        {/* NUEVOS PEDIDOS */}
        <Card
          title="Nuevos Pedidos"
          value={loading ? "..." : stats.pedidos.nuevos.toString()}
          subtitle="en los últimos 30 días"
          color="text-[#bd76c4]"
          icon="/images/icons/dashboard/pedidos.svg"
        />

        {/* TOTAL PEDIDOS */}
        <Card
          title="Total de Pedidos"
          value={loading ? "..." : stats.pedidos.total.toString()}
          subtitle="pedidos realizados"
          color="text-[#bd76c4]"
          icon="/images/icons/dashboard/pedidos.svg"
        />
      </div>
    </div>
  );
}

/* Componente reutilizable para cada card */
function Card({
  title,
  value,
  subtitle,
  color,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  color: string;
  icon: string;
}) {
  return (
    <div className="relative flex flex-col justify-center bg-white border border-[#e1e4ed] rounded-lg shadow-sm p-6 text-left min-h-[120px]">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-lg text-black font-semibold">{title}</div>
          <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
          <div className="text-sm text-[#6d758f]">{subtitle}</div>
        </div>
        <Image src={icon} alt={title} width={32} height={32} />
      </div>
    </div>
  );
}
