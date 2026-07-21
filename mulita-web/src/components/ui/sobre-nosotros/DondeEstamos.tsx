"use client";
// Se ejecuta del lado del cliente porque usa hooks de estado/efectos (useState, useEffect)

import { useEffect, useState } from "react";
import SkeletonDondeEstamos from "./skelentons/SkeletonDondeEstamos"; // placeholder visual mientras carga
import dynamic from "next/dynamic";

// Importamos el mapa de forma dinámica (lazy loading):
// - ssr: false evita que se intente renderizar en el servidor, porque las librerías
//   de mapas suelen depender del objeto "window" del navegador, que no existe en el servidor.
// - Esto también reduce el tamaño del bundle inicial, ya que el código del mapa
//   solo se descarga cuando el componente realmente se usa.
const Mapa = dynamic(() => import("@/components/ui/sobre-nosotros/Mapa"), {
  ssr: false,
});

// Forma esperada de los datos que trae la API para esta sección
interface DondeEstamosData {
  id: number;
  titulo: string;
  contenido: string;
}

export function DondeEstamos() {
  // Datos de la sección (empieza undefined hasta que llega la respuesta de la API)
  const [dondeEstamos, setDondeEstamos] = useState<DondeEstamosData>();
  // Controla si mostramos el skeleton mientras se espera la respuesta
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Función async separada porque useEffect no puede recibir un callback async directamente
    const fetchDondeEstamos = async () => {
      try {
        const res = await fetch("/api/sobreNosotros/dondeEstamos"); // Llamada a la API que devuelve los datos de esta sección
        const data = await res.json();
        setDondeEstamos(data);
      } catch (err) {
        // Si falla el fetch, lo dejamos registrado en consola (no se le avisa al usuario)
        console.error("Error al obtener Donde Estamos:", err);
      } finally {
        // Se ejecuta tanto si salió bien como si hubo error: apaga el estado de carga
        setLoading(false);
      }
    };

    fetchDondeEstamos(); // Llamamos a la función que hace el fetch de datos
  }, []); // Array vacío: se ejecuta una sola vez, al montar el componente

  // Mientras carga, mostramos el esqueleto en vez del contenido real
  if (loading) return <SkeletonDondeEstamos />;

  // Si terminó de cargar pero no hay datos (ej: la API no devolvió nada), mostramos un aviso
  if (!dondeEstamos)
    return <p className="text-center mt-10">No hay contenido disponible</p>;

  return (
    // id="donde-estamos" permite que otros links del sitio salten directo a esta sección
    // como el link "¿Dónde estamos?" del Footer: /sobreNosotros#donde-estamos
    <section
      id="donde-estamos"
      className="w-full px-6 md:px-20 lg:px-40 py-16 bg-white"
    >
      {/* Encabezado con título y línea decorativa amarilla debajo */}
      <div className="text-center mb-12">
        <h3 className="text-[#003c71] font-extrabold text-3xl md:text-4xl mb-3">
          {dondeEstamos.titulo}
        </h3>
        <div className="w-16 h-1 bg-yellow-400 mx-auto mt-4 rounded-full"></div>
      </div>

      {/* Grid principal: 1 columna en mobile, 2 en desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        {/* Columna izquierda: mapa interactivo */}
        <div className="w-full">
          <Mapa />
        </div>

        {/* Columna derecha: texto descriptivo */}
        <div className="flex flex-col justify-center">
          {/* whitespace-pre-line respeta los saltos de línea que vengan
              en el texto guardado en la base de datos (por ejemplo, si el contenido
              tiene párrafos separados con \n) */}
          <p className="text-gray-700 leading-7 mb-6 whitespace-pre-line">
            {dondeEstamos.contenido}
          </p>
        </div>
      </div>
    </section>
  );
}