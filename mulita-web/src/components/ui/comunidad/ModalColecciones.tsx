"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import SkeletonColecciones from "./skeletons/SkeletonColecciones";

type ModalColeccionesProps = {
  isOpen: boolean;
  actividadId: string;
  onClose: () => void;
};

type Coleccion = {
  id: string;
  nombre: string;
};

// ModalColecciones es un componente que muestra un modal para agregar o quitar una actividad de las colecciones del usuario. 
// Permite ver las colecciones existentes, seleccionar o deseleccionar la actividad en ellas, y crear nuevas colecciones.
export default function ModalColecciones({
  isOpen,
  actividadId,
  onClose,
}: ModalColeccionesProps) {
  const [colecciones, setColecciones] = useState<Coleccion[]>([]); // Estado para almacenar las colecciones del usuario
  const [seleccionadas, setSeleccionadas] = useState<string[]>([]); // Estado para almacenar los IDs de las colecciones donde la actividad ya está agregada
  const [nuevaColeccion, setNuevaColeccion] = useState(""); // Estado para almacenar el nombre de la nueva colección que el usuario quiere crear
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar colecciones del usuario y las de la actividad
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Traer todas las colecciones del usuario
        const resColecciones = await fetch("/api/colecciones");
        if (!resColecciones.ok) throw new Error("Error al obtener colecciones");
        const coleccionesData = await resColecciones.json(); // Guardamos las colecciones obtenidas en el estado
        setColecciones(coleccionesData); 

        // Traer colecciones donde ya está esta actividad
        const resActividad = await fetch(
          `/api/comunidad/actividades/${actividadId}/colecciones`
        );
        if (!resActividad.ok)
          throw new Error("Error al obtener colecciones de la actividad");
        const coleccionesActividad = await resActividad.json();

        // Marcar las existentes
        setSeleccionadas(coleccionesActividad); // Guardamos los IDs de las colecciones donde la actividad ya está agregada
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, actividadId]); // Dependencias: se ejecuta cuando el modal se abre o cambia la actividad

  // Alternar selección (agrega o quita actividad de la colección)
  const toggleSeleccion = async (id: string) => {
    const yaSeleccionada = seleccionadas.includes(id); // Verificamos si la colección ya está seleccionada
    setLoading(true);
    try {
      if (yaSeleccionada) {
        // Eliminar la actividad de la colección
        const res = await fetch(
          `/api/comunidad/actividades/${actividadId}/colecciones`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coleccion_id: id }),
          }
        );
        if (!res.ok) throw new Error("Error al eliminar de la colección");
        toast.success("Actividad removida de colección");
        setSeleccionadas((prev) => prev.filter((c) => c !== id));
      } else {
        // Agregar la actividad a la colección
        const res = await fetch(`/api/colecciones/${id}`,{
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actividadIds: [actividadId] }),
        });
        if (!res.ok) throw new Error("Error al agregar a la colección");
        toast.success("Actividad agregada a colección");
        setSeleccionadas((prev) => [...prev, id]);
      }
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar colección");
      setError(err.message);
    } finally {
      setLoading(false); // para que no se quede el modal en estado de carga
    }
  };

  // Crear nueva colección y asociar la actividad
  const handleCrearColeccion = async () => {
    if (!nuevaColeccion.trim()) return; // Validación: no permitir nombres vacíos
    setLoading(true);
    try {
      // Crear la colección
      const res = await fetch("/api/colecciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nuevaColeccion }),
      });
      if (!res.ok) throw new Error("Error al crear la colección");

      const nueva = await res.json();
      setColecciones((prev) => [...prev, nueva]);

      // Asociar la actividad a la nueva colección
      const resAsociar = await fetch(`/api/colecciones/${nueva.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actividadIds: [actividadId] }), // Enviamos el ID de la actividad para asociarla a la nueva colección
      });

      if (!resAsociar.ok)
        throw new Error("Error al asociar actividad a la nueva colección");

      // Actualizar estado local
      toast.success("Colección creada y actividad agregada");
      setSeleccionadas((prev) => [...prev, nueva.id]); // Agregamos la nueva colección a las seleccionadas
      setNuevaColeccion(""); // Limpiamos el input de nueva colección
      setCreating(false);
    } catch (err: any) {
      toast.error(err.message || "Error al crear colección");
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex justify-center items-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white w-full max-w-md rounded-2xl shadow-lg p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4 text-[#003c71]">
          Agregar a colecciones
        </h2>

        {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

        {/* Lista de colecciones */}
        <div className="max-h-60 overflow-y-auto mb-4 border rounded-md">
          {loading ? (
            <SkeletonColecciones />
          ) : colecciones.length === 0 ? (
            <p className="text-center text-gray-500 py-4">
              No tienes colecciones aún.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {colecciones.map((col) => (
                <li
                  key={col.id}
                  className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => toggleSeleccion(col.id)} // Al hacer clic en una colección, se alterna su selección (agregar o quitar la actividad)
                >
                  <span className="text-gray-800">{col.nombre}</span>
                  <input
                    placeholder="colecciones"
                    type="checkbox"
                    checked={seleccionadas.includes(col.id)}
                    readOnly
                    className="accent-[#003c71] w-4 h-4"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Crear nueva colección */}
        {creating ? (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Nombre de la nueva colección"
              value={nuevaColeccion}
              onChange={(e) => setNuevaColeccion(e.target.value)}
              className="w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-[#003c71] focus:outline-none"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setCreating(false)}
                className="text-gray-500 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearColeccion}
                disabled={loading}
                className="bg-[#003c71] text-white px-4 py-1 rounded-md text-sm hover:bg-[#00509e] disabled:opacity-50"
              >
                {loading ? "Creando..." : "Crear"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="text-[#003c71] text-sm mb-4 font-semibold hover:underline"
          >
            + Crear nueva colección
          </button>
        )}

        {/* Botones */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
