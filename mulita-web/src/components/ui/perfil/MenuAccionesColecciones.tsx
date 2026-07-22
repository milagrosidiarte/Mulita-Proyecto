"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react"; // ícono de 3 puntos verticales (en vez del emoji ⋮ que usaban los otros menús)
import ConfirmDialog from "@/components/ConfirmDialog"; // mismo diálogo de confirmación que vimos en CarritoPage

type Props = {
  coleccionId: string;
  onEditar: (id: string) => void; // callback: qué hacer al elegir "Editar" 
  onEliminar: (id: string) => void; // callback: qué hacer al confirmar la eliminación
};

export default function MenuAccionesColecciones({ coleccionId, onEditar, onEliminar }: Props) {
  const [open, setOpen] = useState(false); // si el menú desplegable está visible
  const [showConfirmDelete, setShowConfirmDelete] = useState(false); // si se muestra el diálogo de "¿estás seguro?"
  const menuRef = useRef<HTMLDivElement>(null); // referencia al contenedor, para detectar clicks afuera

  // Alterna el menú abierto/cerrado usando la forma funcional del setState
  const toggleMenu = () => setOpen((prev) => !prev);

  // cerrar al hacer click afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  

  // Click en "Editar": evita que el click se propague, cierra el menú,
  // y delega la acción real al componente padre vía el callback onEditar
  const handleEditarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    onEditar(coleccionId);
  };

  // Click en "Eliminar": NO elimina directamente.
  // Cierra el menú y abre el diálogo de confirmación en su lugar
  const handleEliminarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(false);
    setShowConfirmDelete(true);
  };

  // Se ejecuta solo si el usuario confirma en el ConfirmDialog
  const handleConfirmDelete = async () => {
    await onEliminar(coleccionId);
  };

  // Wrapper del click en el botón de 3 puntos: evita que el click se propague
  const handleToggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleMenu();
  };

  return (
    <>
      {/* Diálogo de confirmación, siempre montado (controlado por isOpen) */}
      <ConfirmDialog
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title="Eliminar colección"
        message="¿Estás seguro de que deseas eliminar esta colección? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous={true}
        onConfirm={handleConfirmDelete}
      />

      <div className="relative" ref={menuRef}>
        {/* Botón de 3 puntos, con tooltip nativo del navegador vía "title" */}
        <button
          title="menu acciones colecciones"
          onClick={handleToggleMenu}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </button>

        {/* Menú desplegable, solo si open=true */}
        {open && (
          <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-xl shadow-md z-50">
            <button
              onClick={handleEditarClick}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded-t-xl"
            >
              Editar
            </button>
            <button
              onClick={handleEliminarClick}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-xl"
            >
              Eliminar
            </button>
          </div>
        )}
      </div>
    </>
  );
}