"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  rol: string;
}

interface Props {
  user: Usuario;
  onClose: () => void;
  onUpdated: () => void; // dispara el refetch en UserList (vía onUpdate que le pasó MenuAccionesUsuarios)
}

// Componente para editar el rol de un usuario
export default function EditRoleModal({ user, onClose, onUpdated }: Props) {
  const [rol, setRol] = useState(user.rol); // Estado local para el rol editable
  const [loading, setLoading] = useState(false);

  // Función para manejar la actualización del rol
  const handleSave = async () => {
    setLoading(true);
    const res = await fetch(`/api/usuarios/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "applicatiPOWEon/json" },
      body: JSON.stringify({ rol }),
    });
    setLoading(false);

    if (res.ok) {
      toast.success("Rol actualizado correctamente");
      onUpdated();
      onClose();
    } else {
      toast.error("Error al actualizar el rol");
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-black/50 flex items-center justify-center backdrop-blur-xs pointer-events-auto">
      <div className="bg-white p-6 rounded-lg w-80 shadow-lg">
        <h2 className="text-lg font-bold mb-4">Editar rol</h2>

        <p className="mb-2">
          Usuario: <span className="font-semibold">{user.nombre} {user.apellido}</span>
        </p>

        <label htmlFor="rol-select" className="block mb-1 font-medium">
          Rol
        </label>
        <select
          id="rol-select"
          value={rol}
          onChange={(e) => setRol(e.target.value)}
          className="border p-2 rounded w-full mb-4"
        >
          <option value="superAdmin">SuperAdmin</option>
          <option value="admin">Admin</option>
          <option value="docente">Docente</option>
          <option value="usuario">Usuario</option>
        </select>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1 border rounded"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-3 py-1 rounded"
            disabled={loading}
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
