"use client";

import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import EditRolModal from "./EditRolModal";
import EditPermissionsModal from "./EditPermisosModal";
import Link from "next/link";
import { useUser } from "@/hooks/queries";

// Define los tipos de datos para el usuario y las props del componente
interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  imagen?: string;
  rol: string;
  acceso_comunidad: boolean;
}

interface Props {
  user: Usuario;
  onUpdate: () => void; // Callback para actualizar la lista de usuarios después de una acción
}

// Componente principal que maneja el menú de acciones para cada usuario
export default function MenuAccionesUsuarios({ user, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState<null | "perfil" | "rol" | "permisos">(null); // Estado para controlar qué modal está abierto
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { isSuperAdmin, user: currentUser, isLoading } = useUser(); // Hook personalizado para obtener información del usuario actual y verificar si es superadministrador

  // Cierra el menú al hacer clic afuera
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Función para manejar la eliminación del usuario
  const handleDelete = async () => {
    const res = await fetch(`/api/usuarios/${user.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Usuario marcado como eliminado.");
      onUpdate();
    } else {
      toast.error("Error al eliminar usuario.");
    }
  };

  // Determina si el usuario actual puede editar o eliminar al usuario seleccionado
  const canEditOrDelete = isSuperAdmin() && currentUser?.id !== user.id;
  console.log("canEditOrDelete:", canEditOrDelete); // Muestra en la consola si el usuario actual puede editar o eliminar al usuario seleccionado
  console.log("currentUser ID:", currentUser?.id, "User ID:", user.id); // Muestra en la consola los IDs del usuario actual y del usuario seleccionado

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1 rounded hover:bg-gray-200"
      >
        ⋮
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-10">
          <Link
            href={`/perfil/${user.id}`}
            onClick={() => setOpen(false)}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Ver perfil
          </Link>

          <button
            onClick={() => {
              if (!canEditOrDelete) return;
              setModal("rol");
              setOpen(false);
            }}
            disabled={!canEditOrDelete}
            className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${!canEditOrDelete ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            Editar rol
          </button>
          
          <button
            onClick={() => {
              setModal("permisos");
              setOpen(false);
            }}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Editar permisos
          </button>

          <button
            onClick={ () => {
              if (!canEditOrDelete) return;
              setShowConfirmDelete(true);
              setOpen(false);
            }}
            disabled={!canEditOrDelete}
            className={`block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 ${!canEditOrDelete ? "opacity-50 cursor-not-allowed " : ""}`}
          >
            Eliminar usuario
          </button>
        </div>
      )}

      <ConfirmDialog
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title="Eliminar usuario"
        message="¿Estás seguro de que deseas marcar este usuario como eliminado?"
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous={true}
        onConfirm={handleDelete}
      />

      {modal === "rol" && (
        <EditRolModal
          user={user}
          onClose={() => setModal(null)}
          onUpdated={onUpdate}
        />
      )}
      {modal === "permisos" && (
        <EditPermissionsModal
          user={user}
          onClose={() => setModal(null)}
          onUpdated={onUpdate}
        />
      )}
    </div>
  );
}
