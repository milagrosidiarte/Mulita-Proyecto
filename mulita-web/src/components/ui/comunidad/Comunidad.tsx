"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/queries";
import toast from "react-hot-toast";
import { SidebarComunidad } from "@/components/ui/comunidad/SidebarComunidad"; // Importamos el componente SidebarComunidad que representa la barra lateral de la sección de comunidad
import Actividades from "./Actividades"

export default function Comunidad() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoading } = useUser();
  const router = useRouter();
  const hasRedirected = useRef(false);

  // Efecto para redirigir al usuario a la página de login si no está autenticado
  useEffect(() => {
    if (!isLoading && !user && !hasRedirected.current) {
      hasRedirected.current = true;
      toast.error("Debes iniciar sesión para acceder a la comunidad");
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  // Mientras carga o si no hay usuario, no mostrar nada
  if (isLoading || !user) {
    return null;
  }

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Sidebar */}
      <SidebarComunidad isOpen={isOpen} onClose={() => setIsOpen(false)} />

      {/* Contenedor principal con un único scroll */}
      <main className="flex-1 overflow-auto p-6 ml-0 md:ml-60">
        {/* Botón para abrir sidebar en mobile */}
        <button
          onClick={() => setIsOpen(true)}
          className="md:hidden mb-4 px-4 py-2 rounded-md bg-[#003c71] text-white font-semibold shadow-sm hover:bg-[#002a50] active:bg-[#001c36] transition-colors duration-200"
        >
          ☰ Menú
        </button>

        <Actividades />
      </main>
    </div>
  );
}
