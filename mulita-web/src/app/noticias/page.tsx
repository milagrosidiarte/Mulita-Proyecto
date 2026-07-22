"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@/hooks/queries";
import { SkeletonNoticias } from "@/components/ui/inicio/skeletons/SkeletonNoticias";

// Definición de la interfaz Noticia para tipar los datos de las noticias
interface Noticia {
  id: number;
  titulo: string;
  autor: string;
  introduccion: string;
  descripcion: string;
  imagen_principal: string;
  archivo?: string | null;
  created_at: string;
}

// Componente principal de la página de noticias
export default function NoticiasPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loadingNoticias, setLoadingNoticias] = useState(true);

  // Traer noticias desde la API
  useEffect(() => {
    const fetchNoticias = async () => {
      try {
        const res = await fetch("/api/noticias");
        const data = await res.json();
        const noticiasArray = Array.isArray(data) ? data : (data?.noticias || []); // Asegurarse de que sea un array
        setNoticias(noticiasArray.reverse()); // Las más recientes primero
      } catch (err) {
        console.error("Error fetching noticias:", err);
        setNoticias([]);
      } finally {
        setLoadingNoticias(false);
      }
    };
    fetchNoticias();
  }, []);


  if (isUserLoading || loadingNoticias) {
    return <SkeletonNoticias />;
  }

  return (
    <div className="w-full py-10 bg-white overflow-hidden flex flex-col items-center justify-start px-4 md:px-16 lg:px-24 gap-[41px]">
      {/* Encabezado */}
      <div className="relative w-full text-center text-xs text-[#6d758f]">
        <h1 className="text-4xl font-extrabold text-[#003c71] py-1">Noticias</h1>
        <p className="text-sm leading-[22px] py-2">Últimas noticias y novedades</p>
        <div className="w-[87px] mx-auto border-t-[4px] border-[#fedd00]" />
      </div>

      {/* Grid de noticias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {noticias.map((noticia) => (
          <div
            key={noticia.id}
            className="relative shadow-lg rounded-lg border border-[#e1e4ed] overflow-hidden flex flex-col"
          >
            <div className="w-full h-48 overflow-hidden rounded-t-lg">
              {/* Imagen principal */}
              <img
                src={noticia.imagen_principal}
                alt={noticia.titulo}
                className="w-full h-48 object-cover"
              />
            </div>
            <div className="p-4 flex flex-col gap-2">
              <h2 className="text-xl font-bold text-[#003c71]">{noticia.titulo}</h2>
              <p className="text-sm text-gray-600">{noticia.introduccion}</p>
              <Link
                href={`/noticias/${noticia.id}`}
                className="mt-2 inline-flex items-center gap-1 text-[#003c71] font-semibold hover:underline"
              >
                Conocé más →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
