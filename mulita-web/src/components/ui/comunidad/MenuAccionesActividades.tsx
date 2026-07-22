"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import ModalColecciones from "./ModalColecciones";

// MenuAccionesActividades es un componente que muestra un menú de acciones para una actividad en la comunidad.
// Dependiendo del rol del usuario y si es el autor de la actividad, se muestran diferentes opciones como ver perfil, agregar a colección, editar o eliminar.
type Actividad = {
  id: string;
  usuario_id: string;
};

type AccionesMenuProps = {
  actividad: Actividad;
  userId: string;
  rol: string;
  onActividadEliminada?: (actividadId: string) => void; // Callback opcional que se llama cuando la actividad es eliminada, para actualizar la vista del padre
};

// MenuAccionesActividades es un componente que muestra un menú de acciones para una actividad en la comunidad.
export default function MenuAccionesActividades({ actividad, userId, rol, onActividadEliminada }: AccionesMenuProps) {
  const [open, setOpen] = useState(false);
  const [modalColeccionesOpen, setModalColeccionesOpen] = useState(false); // Estado para controlar la apertura del modal de colecciones
  const [showConfirmDelete, setShowConfirmDelete] = useState(false); // Estado para controlar la apertura del diálogo de confirmación de eliminación
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const esAutor = actividad.usuario_id === userId; // Verificamos si el usuario actual es el autor de la actividad
  const esAdmin = rol === "admin" || rol === "superAdmin"; // Verificamos si el usuario tiene rol de admin o superAdmin

  const toggleMenu = () => setOpen((prev) => !prev); // Función para alternar la apertura del menú de acciones

  // Cerrar menú al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Función para manejar la eliminación de la actividad
  const handleEliminar = async () => {
    try {
      const res = await fetch(`/api/comunidad/actividades/${actividad.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Error eliminando la actividad");

      toast.success("Actividad eliminada correctamente");
      setOpen(false);
      setShowConfirmDelete(false);
      
      // Llamar al callback si existe para eliminar de la vista al instante
      if (onActividadEliminada) {
        onActividadEliminada(actividad.id); // Llamamos al callback para notificar al componente padre que la actividad fue eliminada
      } else {
        // Si no hay callback, redirigir a comunidad
        router.push("/comunidad");
      }
    } catch (err: any) {
      console.error(err);
      toast.error("No se pudo eliminar la actividad");
    }
  };

  // Función para abrir el modal de colecciones
  const handleAbrirModalColecciones = () => {
    setOpen(false); // Cerramos el menú antes de abrir el modal 
    setModalColeccionesOpen(true); // Abrimos el modal de colecciones
  };

  return (
    <>
      <ConfirmDialog
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title="Eliminar actividad"
        message="¿Estás seguro de que deseas eliminar esta actividad? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous={true}
        onConfirm={handleEliminar}
      />
      <div className="relative" ref={menuRef}>
        <button
          onClick={toggleMenu}
          className="text-gray-600 hover:text-gray-900 text-xl leading-none px-2"
        >
          ⋯
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 flex flex-col">
            <Link
              href={`/perfil/${actividad.usuario_id}`}
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-left hover:bg-gray-100 text-sm"
            >
              Ver perfil
            </Link>

            <button
              onClick={handleAbrirModalColecciones}
              className="px-4 py-2 text-left hover:bg-gray-100 text-sm"
            >
              Agregar a colección
            </button>

            {esAutor && (
              <>
                <hr className="my-1 border-gray-200" />
                <Link
                  href={`/comunidad/actividades/editar/${actividad.id}`}
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-left hover:bg-gray-100 text-sm text-blue-600"
                >
                  Editar
                </Link>

                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="px-4 py-2 text-left hover:bg-gray-100 text-sm text-red-600"
                >
                  Eliminar
                </button>
              </>
            )}

            {esAdmin && !esAutor && (
              <>
                <hr className="my-1 border-gray-200" />
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="px-4 py-2 text-left hover:bg-gray-100 text-sm text-red-600"
                >
                  Eliminar
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modal Colecciones */}
      {modalColeccionesOpen && (
        <ModalColecciones
          isOpen={modalColeccionesOpen} 
          onClose={() => setModalColeccionesOpen(false)} // Cerramos el modal al hacer clic en cerrar
          actividadId={actividad.id} // Pasamos el ID de la actividad al modal para que pueda agregarla a una colección
        />
      )}
    </>
  );
}
