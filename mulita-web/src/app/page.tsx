"use client";

import { Hero } from "@/components/ui/inicio/Hero";
import { SeccionNoticias } from "@/components/ui/inicio/SeccionNoticias";
import { SeccionProductos } from "@/components/ui/inicio/SeccionProductos";
import { Documentacion } from "@/components/ui/inicio/Documentacion";
import { useEffect, useState } from "react";

// Mapa de componentes para renderizar dinámicamente las secciones
const COMPONENTS_MAP: Record<string, React.FC> = {
  Hero,
  SeccionNoticias,
  SeccionProductos,
  Documentacion,
};

// Componente principal de la página de inicio
export default function HomePage() {
  const [secciones, setSecciones] = useState<{nombre: string}[]>([]); // Estado para almacenar las secciones obtenidas de la API

  useEffect(() => {
    fetch("/api/inicio/secciones")
      .then(res => res.json())
      .then(data => setSecciones(data.secciones)); // Actualizamos el estado con las secciones obtenidas de la API
  }, []);

  return (
    <>
      {/* Renderizamos dinámicamente cada sección según su nombre */}
      {secciones.map(sec => {
        const Component = COMPONENTS_MAP[sec.nombre]; // Obtenemos el componente correspondiente al nombre de la sección
        return Component ? <Component key={sec.nombre} /> : null; // Si no se encuentra el componente, no renderizamos nada
      })}
    </>
  );
}
