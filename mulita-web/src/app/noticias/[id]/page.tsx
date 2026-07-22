"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BackButton from "@/components/ui/dashboard/BackButton";
import SkeletonNoticiaDetalle from "@/components/ui/noticias/skeletons/SkeletonNoticiaDetalle";

// Definimos la interfaz para el tipo de datos de una noticia, 
// que incluye propiedades como id, título, autor, introducción, 
// descripción, imagen principal, archivo opcional y fecha de creación
interface Noticia {
  id: number;
  titulo: string;
  autor: string;
  introduccion: string;
  descripcion: string;
  imagen_principal: string;
  archivo?: string;
  created_at: string;
}

// Definimos la función para la página de detalle de una noticia, 
// que incluye la visualización de la información completa de la noticia 
// y un botón para regresar a la lista de noticias
export default function NoticiaDetalle() {
  const params = useParams();
  const [noticia, setNoticia] = useState<Noticia | null>(null);
  const [loading, setLoading] = useState(true);

  // Función para formatear la fecha de creación de la noticia a un formato legible
  const formatDate = (dateString: string) => {
    if (!dateString) return "Sin fecha";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Sin fecha";
    return date.toLocaleDateString();
  }

  // useEffect para obtener la noticia desde la API cuando el componente se monta 
  // o cuando cambia el id de la noticia
  useEffect(() => {
    const fetchNoticia = async () => {
      try {
        const res = await fetch(`/api/noticias/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setNoticia(data.noticia || data);
        } else {
          console.error("No se pudo cargar la noticia");
          setNoticia(null);
        }
      } catch (err) {
        console.error("Error cargando noticia:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNoticia();
  }, [params.id]); // Dependencia para volver a cargar si cambia el id de la noticia

  if (loading) return <SkeletonNoticiaDetalle /> ;
  if (!noticia) return <div className="text-center py-10">No se encontró la noticia</div>;

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 md:px-16 flex flex-col gap-6">
      <div className="mb-4">
        <BackButton />
      </div>
      <div className="shador-lg border border-gray-200 overflow-hidden flex flex-col gap-6 p-6 rounded-lg bg-white">
        <h1 className="text-4xl font-bold text-[#003c71]">{noticia.titulo}</h1>
        <p className="text-sm text-[#6d758f]">
          Por {noticia.autor} - {formatDate(noticia.created_at)}
        </p>
        <p className="text-base text-gray-800">{noticia.introduccion}</p>
        <img
          src={noticia.imagen_principal}
          alt={noticia.titulo}
          className="w-full h-64 object-cover rounded-lg"
        />
        <p className="text-base text-gray-800">{noticia.descripcion}</p>
        {noticia.archivo && (
          <a
            href={noticia.archivo}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            Descargar archivo
          </a>
        )}
      </div>
    </div>
  );
}
