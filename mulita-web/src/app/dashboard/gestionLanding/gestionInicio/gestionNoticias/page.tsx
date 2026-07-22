"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/queries";

// Definimos la interfaz para una noticia, que incluye su id, título y si se muestra en inicio
interface Noticia {
  id: number;
  titulo: string;
  mostrar_en_inicio: boolean;
}

// Definimos la función para la página de gestión de noticias, que incluye la lista de noticias y la funcionalidad para marcar/desmarcar si se muestran en inicio
export default function GestionNoticiasPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loadingNoticias, setLoadingNoticias] = useState(true);

  // Traer noticias desde la API
  useEffect(() => {
    const fetchNoticias = async () => {
      try {
        const res = await fetch("/api/noticias");
        const data = await res.json();
        const noticiasArray = Array.isArray(data) ? data : (data?.noticias || []); // Asegurarse de que data sea un array
        setNoticias(noticiasArray.reverse()); // Invertir el orden de las noticias para mostrar la más reciente primero
      } catch (err) {
        console.error("Error fetching noticias:", err);
        setNoticias([]); // En caso de error, establecer noticias como un array vacío
      } finally {
        setLoadingNoticias(false);
      }
    };
    fetchNoticias();
  }, []);

  // Marcar/desmarcar noticia para mostrar en inicio
  const togglemostrar_en_inicio = async (noticia: Noticia) => {
    try {
      const res = await fetch(`/api/inicio/noticias/${noticia.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Error actualizando noticia");

      // Actualizar estado local
      const updated = await res.json();
      console.log("respuesta del patch: ", updated);

      setNoticias((prev) =>
        prev.map((n) => (n.id === noticia.id ? updated[0] : n)) // Actualizar la noticia específica en el estado local
      );
    } catch (err) {
      console.error(err);
      alert("No se pudo actualizar el estado de la noticia");
    }
  };

  if (isUserLoading || loadingNoticias) {
    return <p className="text-center mt-10">Cargando noticias...</p>;
  }

  return (
    <div className="w-full min-h-screen relative overflow-hidden flex flex-col items-center px-4 sm:px-6 pb-10 box-border font-inter">
      {/* Header + botón agregar */}
      <div className="w-full max-w-[1103px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
        <div className="flex flex-col text-[28px] sm:text-[32px] md:text-[36px]">
          <h1 className="leading-tight font-extrabold text-black">
            Gestión Noticias
          </h1>
          <p className="mt-2 text-left text-sm sm:text-base leading-6 text-[#6d758f]">
            Gestiona las noticias que serán visibles en el inicio.
          </p>
        </div>
      </div>

      {/* Lista de noticias */}
      <div className="flex-1 w-full max-w-[1100px] mt-6 flex flex-col gap-4">
        {noticias.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">
            No hay noticias disponibles.
          </p>
        ) : (
          noticias.map((noticia, index) => (
            <div
              key={noticia.id ?? index} // fallback por si id es undefined
              className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6 bg-white border border-[#e1e4ed] rounded-lg shadow-sm hover:shadow-md transition"
            >
              <div className="text-base sm:text-lg font-semibold text-black break-words">
                {noticia.titulo}
              </div>

              <div className="flex gap-2 items-center">
                <button
                  className={`py-1 px-3 rounded-md text-sm font-semibold ${
                    noticia.mostrar_en_inicio
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-black"
                  } hover:opacity-80 transition`}
                  onClick={() => togglemostrar_en_inicio(noticia)}
                >
                  {noticia.mostrar_en_inicio
                    ? "En Inicio"
                    : "Mostrar en Inicio"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
