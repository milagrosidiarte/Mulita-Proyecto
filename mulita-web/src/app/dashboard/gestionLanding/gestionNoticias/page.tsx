"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useUser } from "@/hooks/queries";
import MenuAccionesNoticias from "@/components/ui/noticias/MenuAccionesNoticias";

// Definimos la interfaz para una noticia, que incluye su id, título
interface Noticia {
  id: number;
  titulo: string;
}

// Definimos la función para la página de gestión de noticias, que incluye la lista de noticias 
// y la funcionalidad para marcar/desmarcar si se muestran en inicio
export default function GestionNoticiasPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [loadingNoticias, setLoadingNoticias] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  // Traer noticias desde la API
  useEffect(() => {
    const fetchNoticias = async () => {
      try {
        const res = await fetch("/api/noticias");
        const data = await res.json();
        const noticiasArray = Array.isArray(data) ? data : (data?.noticias || []); // Aseguramos que sea un array
        setNoticias(noticiasArray.reverse()); // Las más recientes primero
      } catch (err) {
        console.error("Error fetching noticias:", err);
        setNoticias([]);
      } finally {
        setLoadingNoticias(false);
      }
    };
    fetchNoticias(); // Llamamos a la función para traer las noticias al montar el componente
  }, []);

  // Función para eliminar una noticia
  const handleEliminar = async (id: number) => {
    try {
      await fetch(`/api/noticias/${id}`, { method: "DELETE" });
      setNoticias((prev) => prev.filter((n) => n.id !== id)); // Actualizamos el estado para eliminar la noticia de la lista
      toast.success("Noticia eliminada exitosamente");
      setConfirmDelete(null);
    } catch (err) {
      console.error("Error eliminando noticia:", err);
      toast.error("Error al eliminar la noticia");
    }
  };

  // Función para abrir el diálogo de confirmación de eliminación
  const handleOpenConfirmDelete = (id: number) => {
    setConfirmDelete(id);
  };

  // Renderizamos un mensaje de carga mientras se obtienen los datos del usuario o las noticias
  if (isUserLoading || loadingNoticias) {
    return <p className="text-center mt-10">Cargando noticias...</p>;
  }

  return (
    <>
      <ConfirmDialog
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Eliminar noticia"
        message="¿Estás seguro de que deseas eliminar esta noticia? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous={true}
        onConfirm={() => {
          if (confirmDelete !== null) handleEliminar(confirmDelete);
        }}
      />
      <div className="w-full min-h-screen relative overflow-hidden flex flex-col items-center px-4 sm:px-6 pb-10 box-border font-inter">
      {/* Header + botón agregar */}
      <div className="w-full max-w-[1103px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
        <div className="flex flex-col text-[28px] sm:text-[32px] md:text-[36px]">
          <h1 className="leading-tight font-extrabold text-black">
            Gestión Noticias
          </h1>
          <p className="mt-2 text-left text-sm sm:text-base leading-6 text-[#6d758f]">
            Gestiona las noticias creadas o crea una nueva.
          </p>
        </div>

        {(user?.rol === "admin" || user?.rol === "superAdmin") && (
          <Link
            href="/noticias/crear"
            className="shadow-md rounded-md bg-[#f8faff] border border-[#e0e0e0] py-2 px-4 text-sm text-black font-semibold hover:bg-[#eef2ff] transition self-start sm:self-auto"
          >
            + Agregar
          </Link>
        )}
      </div>

      {/* Lista de noticias */}
      <div className="flex-1 w-full max-w-[1100px] mt-6 flex flex-col gap-4 mb-8">
        {noticias.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">
            No hay noticias disponibles.
          </p>
        ) : (
          noticias.map((noticia) => (
            <div
              key={noticia.id}
              className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6 bg-white border border-[#e1e4ed] rounded-lg shadow-sm hover:shadow-md transition"
            >
              <div className="text-base sm:text-lg font-semibold text-black break-words">
                {noticia.titulo}
              </div>

              {(user?.rol === "admin" || user?.rol === "superAdmin") && (
                <div className="self-end sm:self-auto">
                  <MenuAccionesNoticias
                    noticiaId={noticia.id}
                    onEliminar={handleOpenConfirmDelete}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
      </div>
    </>
  );
}
