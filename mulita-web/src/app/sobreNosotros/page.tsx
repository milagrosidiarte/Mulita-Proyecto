"use client";

import { HeroSobreNosotros } from "@/components/ui/sobre-nosotros/HeroSobreNosotros";
import { QuienesSomos } from "@/components/ui/sobre-nosotros/QuienesSomos";
import { MisionVision } from "@/components/ui/sobre-nosotros/MisionVision";
import { DondeEstamos } from "@/components/ui/sobre-nosotros/DondeEstamos";
import { useEffect, useState } from "react";

// Mapeo de nombres de secciones a componentes
const COMPONENTS_MAP: Record<string, React.FC> = {
  HeroSobreNosotros,
  QuienesSomos,
  MisionVision,
  DondeEstamos,
};

// Componente principal de la página "Sobre Nosotros"
export default function SobreNosotrosPage() {
  const [secciones, setSecciones] = useState<{nombre: string}[]>([]); // Estado para almacenar las secciones obtenidas de la API

  // useEffect para traer las secciones desde la API al montar el componente
  useEffect(() => {
    fetch("/api/sobreNosotros/secciones")
      .then(res => res.json())
      .then(data => setSecciones(data.secciones)); // Asegurarse de que la respuesta tenga la estructura esperada
  }, []);

  return (
    <>
      {secciones.map(sec => { // Iterar sobre las secciones obtenidas de la API
        const Component = COMPONENTS_MAP[sec.nombre]; // Obtener el componente correspondiente al nombre de la sección
        return Component ? <Component key={sec.nombre} /> : null; // Renderizar el componente si existe, de lo contrario renderizar null
      })}
    </>
  );
}
