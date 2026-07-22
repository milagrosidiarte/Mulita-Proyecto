"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SkeletonHero } from "./skeletons/SkeletonHero";

interface HeroData {
  titulo: string;
  descripcion: string;
  imagen: string;
}

// Banner principal de la página de inicio, 
// con título, descripción, imagen y botones de acción. 
export function Hero() {
  const [hero, setHero] = useState<HeroData>();
  const [loadingHero, setLoadingHero] = useState(true);

  useEffect(() => {
    const fetchHero = async () => { 
      try {
        const res = await fetch("/api/inicio/hero");
        const data = await res.json();
        setHero(data);
      } catch (err) {
        console.error("Error al obtener Hero:", err);
      } finally {
        setLoadingHero(false);
      }
    };
    fetchHero();
  }, []);

  if (loadingHero) {
    return <SkeletonHero />;
  }

  if (!hero) {
    return <p className="text-center mt-10">No hay hero definido</p>
  }

  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 items-center gap-10 pt-16 md:pt-24">
          {/* Texto */}
          <div className="order-2 md:order-1">
            <div className="h-1.5 w-16 bg-secondary rounded-full mb-6" />
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-primary drop-shadow-[0_4px_0_var(--uap-yellow)]">
              {hero.titulo}
            </h1>
            <p className="mt-4 text-gray-600 text-lg text-muted-foreground max-w-xl">{hero.descripcion}</p>

            <div className="mt-8 flex items-center gap-4">
              <Link href="/comunidad" className="btn btn--blue">
                Comunidad <span aria-hidden>→</span>
              </Link>

              <Link href="/tienda" className="btn btn--outline">
                Ver Tienda
              </Link>
            </div>
          </div>

          {/* Imagen */}
          <div className="order-2 relative flex items-center justify-center overflow-hidden">
            <img
              alt="Hero Mulita"
              src={hero.imagen}
              className="max-h-80 w-auto drop-shadow-xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
