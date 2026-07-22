"use client";

import { useEffect, useState } from "react";
import SkeletonQuienesSomos from "./skelentons/SkeletonQuienesSomos"; // placeholder de carga

// Forma de cada integrante del equipo dentro de la sección
interface MiembroEquipo {
  nombre: string;
  rol: string;
  imagen: string;
}

// Forma completa de los datos que trae la API para esta sección
interface QuienesSomosData {
  titulo: string;
  descripcion: string;
  equipo: MiembroEquipo[];
}

export function QuienesSomos() {
  // Datos de la sección (undefined hasta que responde la API)
  const [quienesSomos, setQuienesSomos] = useState<QuienesSomosData>();
  // Controla si se muestra el skeleton mientras carga
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuienesSomos = async () => {
      try {
        const res = await fetch("/api/sobreNosotros/quienesSomos");
        
        if (!res.ok) throw new Error("Error al obtener Quienes Somos");
        const data = await res.json();
        setQuienesSomos(data);
      } catch (err) {
        // Error registrado en consola
        console.error(err);
      } finally {
        // Se ejecuta siempre (éxito o error), apagando el estado de carga
        setLoading(false);
      }
    };

    fetchQuienesSomos();
  }, []); // Se ejecuta una sola vez al montar el componente

  // Mientras carga, mostramos el esqueleto
  if (loading) return <SkeletonQuienesSomos />;
  // Si no hay datos (falló la API o no hay contenido cargado), mostramos aviso
  if (!quienesSomos) return <p className="text-center mt-10">No hay contenido disponible</p>;

  return (
    <section id="quienes-somos" className="w-full flex flex-col items-center px-6 md:px-20 lg:px-40 py-16 bg-white">
      
      {/* Título y descripción principal, centrados */}
      <div className="flex flex-col items-center text-center mb-10">
        <h2 className="text-[#003c71] font-extrabold text-3xl md:text-4xl">{quienesSomos.titulo}</h2>
        <p className="max-w-2xl text-base md:text-lg leading-6 mt-4 text-gray-600">
          {quienesSomos.descripcion}
        </p>
        {/* Línea decorativa amarilla, mismo patrón visual que en DondeEstamos y HeroSobreNosotros */}
        <div className="w-16 h-1 bg-yellow-400 mx-auto mt-4 rounded-full"></div>
      </div>

      {/* Grilla de miembros del equipo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 w-full">
        {quienesSomos.equipo.map((miembro, index) => (
          <div
            key={index}
            className="flex flex-col bg-white rounded-xl shadow-md overflow-hidden transform hover:scale-105 transition-all duration-300 cursor-pointer"
          >
            {/* Foto del integrante */}
            <div className="w-full h-48 overflow-hidden">
              <img
                src={miembro.imagen}
                alt={miembro.nombre}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Nombre y rol dentro del equipo */}
            <div className="flex flex-col items-center p-4 gap-1">
              <h4 className="text-[#003c71] font-semibold text-lg">{miembro.nombre}</h4>
              <p className="text-sm text-gray-700">{miembro.rol}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}