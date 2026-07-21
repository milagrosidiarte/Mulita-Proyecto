"use client";
// Se ejecuta en el cliente porque usa useState/useEffect

import { useEffect, useState } from "react";
import SkeletonHeroSobreNosotros from "./skelentons/SkeletonHeroSobreNosotros"; // placeholder de carga
import { set } from "zod";

// Forma de los datos que trae la API para el hero de "Sobre nosotros"
interface HeroSobreNosotrosData {
  titulo: string;
  descripcion: string;
  imagen: string;
}

export function HeroSobreNosotros() {
  // Datos del hero (undefined hasta que responde la API)
  const [hero, setHero] = useState<HeroSobreNosotrosData>();
  // Controla si se muestra el skeleton mientras carga
  const [loadingHero, setLoadingHero] = useState(true);

  useEffect(() => {
    const fetchHero = async () => {
      // Se inicia la carga, mostrando el skeleton
      setLoadingHero(true);
      try {
        const res = await fetch("/api/sobreNosotros/hero");
        const data = await res.json();
        setHero(data);
      } catch (err) {
        // Error solo registrado en consola, sin aviso visual al usuario
        console.error("Error al obtener HeroSobreNosotros:", err);
      } finally {
        // Se ejecuta siempre (éxito o error), apagando el estado de carga para que no se muestre más el skeleton
        setLoadingHero(false);
      }
    };
    fetchHero();
  }, []); // Se ejecuta una sola vez al montar el componente

  // Mientras carga, mostramos el esqueleto
  if (loadingHero) return <SkeletonHeroSobreNosotros />;
  // Si no hay datos (falló la API o no hay hero configurado), mostramos aviso
  if (!hero) return <p className="text-center mt-10">No hay hero definido</p>;

  // Hace scroll suave hasta una sección de la misma página, buscándola por su id
  // (se usa para los botones de abajo, en vez de usar <Link href="#...">
  const scrollToSection = (id: string) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    // Sección principal
    <section id="hero-sobre-nosotros" className="w-full flex flex-col md:flex-row items-center justify-between px-6 md:px-[167px] py-16 bg-white gap-10">
      
      {/* Columna de texto */}
      <div className="flex flex-col items-center md:items-start text-center md:text-left">
        <h2 className="text-[36px] md:text-[48px] font-extrabold text-[#003c71]">
          {hero.titulo}
        </h2>

        <p className="max-w-md text-lg text-gray-600 leading-6 my-6">{hero.descripcion}</p>

        {/* Botones de navegación rápida a otras secciones de la misma página */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
          <button
            onClick={() => scrollToSection("quienes-somos")}
            className="btn btn--blue"
          >
            ¿Quiénes Somos?
          </button>

          <button
            onClick={() => scrollToSection("donde-estamos")}
            className="btn btn--outline"
          >
            ¿Dónde estamos?
          </button>
        </div>
      </div>

      {/* Imagen principal del hero */}
      <div className="w-full md:w-[564px] h-[300px] rounded-lg relative overflow-hidden">
        <img
          className="object-cover w-full h-full"
          src={hero.imagen}
          alt="Sobre nosotros"
        />
      </div>
    </section>
  );
}