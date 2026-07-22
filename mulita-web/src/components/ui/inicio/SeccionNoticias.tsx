"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SkeletonNoticias } from "./skeletons/SkeletonNoticias";
import { set } from "zod";

// Tipo de datos para representar una noticia
interface Noticia {
  id: number;
  titulo: string;
  descripcion: string;
  imagen_principal: string;
}

// Componente principal que representa la sección de noticias destacadas en la página de inicio
export function SeccionNoticias() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loadingNoticias, setLoadingNoticias] = useState(true); // Estado para indicar si las noticias están siendo cargadas desde la API

// Efecto que se ejecuta al montar el componente para obtener las noticias destacadas desde la API
  useEffect(() => {
    const fetchNoticias = async () => {
      setLoadingNoticias(true);
      try {
        const res = await fetch("/api/inicio/noticias");
        const data = await res.json();
        setNoticias(data ?? []); // Si no hay datos, se establece un arreglo vacío
      } catch (err) {
        console.error("Error al obtener noticias destacadas:", err);
      } finally {
        setLoadingNoticias(false);
      }
    };
    fetchNoticias();
  }, []);

  if (loadingNoticias) {
    return <SkeletonNoticias />;
  }

  if (noticias.length === 0) {
    return (
      <section className="mt-24 text-center">
        <p className="text-muted-foreground">No hay noticias destacadas por el momento.</p>
      </section>
    );
  }

  return (
    <section className="mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-center text-[#003C71]">Noticias</h2>
        <p className="text-center text-gray-500 text-muted-foreground mt-2">
          Comunidad, experiencias en escuelas y mejoras de la plataforma.
        </p>
        <div className="w-16 h-1 bg-yellow-400 mx-auto mt-4 rounded-full"></div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {noticias.map((noticia) => (
            <article
              key={noticia.id}
              className="rounded-xl border border-light bg-card p-5 hover:shadow-sm transition relative"
            >
              {noticia.imagen_principal && (
                <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                  <img
                    src={noticia.imagen_principal}
                    alt={noticia.titulo}
                    className="absolute top-0 left-0 w-full h-full object-cover"
                  />
                </div>
              )}

              <h3 className="mt-4 text-lg font-bold text-primary">{noticia.titulo}</h3>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-3">
                {noticia.descripcion}
              </p>

              <div className="mt-4">
                <Link
                  href={`/noticias/${noticia.id}`}
                  className="inline-block text-[#003C71] font-semibold text-sm"
                >
                  Leer más →
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <Link href="/noticias" className="btn btn--blue">
            Ver todas las noticias
          </Link>
        </div>
      </div>
    </section>
  );
}
