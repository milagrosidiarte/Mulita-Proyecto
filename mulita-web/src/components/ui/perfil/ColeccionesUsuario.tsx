"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/queries";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import MenuAccionesColecciones from "./MenuAccionesColecciones"; // el menú de 3 puntos
import SkeletonColeccionesUsuario from "./skeletons/SkeletonColeccionesUsuario";

// Forma de una colección
type Coleccion = {
  id: string;
  nombre: string;
  created_at: string;
  usuario_id: string;
  tipo?: string; // opcional: distingue colecciones especiales, como "favoritos"
};

type ColeccionesUsuarioProps = {
  userPerfilId?: string; // opcional: si se pasa, muestra las colecciones de OTRO usuario (ej: viendo el perfil de alguien más)
};

export default function ColeccionesUsuario({ userPerfilId }: ColeccionesUsuarioProps) {
  const router = useRouter();
  const { user } = useUser();

  const [colecciones, setColecciones] = useState<Coleccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null); // id de la colección que se está renombrando (null = ninguna)
  const [nombreTemporal, setNombreTemporal] = useState(""); // valor del input mientras se edita el nombre

  // Determina si estamos viendo el perfil del propio usuario logueado o el de otra persona.
  // Si no se pasó userPerfilId, asumimos que es el propio perfil.
  // Si se pasó, comparamos contra el id del usuario logueado.
  const esPropioPerfil = !userPerfilId || userPerfilId === user?.id;

  // Trae las colecciones desde la API cada vez que cambia userPerfilId
  useEffect(() => {
    const fetchColecciones = async () => {
      try {
        setLoading(true);

        // Si hay userPerfilId, pide las colecciones de ESE usuario;
        // si no, la API infiere el usuario logueado por el token/sesión
        const query = userPerfilId ? `?userId=${userPerfilId}` : "";
        const res = await fetch(`/api/colecciones${query}`); 
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Error al obtener colecciones");

        // Ordena las colecciones: la de "favoritos" siempre primero,
        // el resto ordenado de más reciente a más antigua
        const coleccionesOrdenadas = data.sort((a: Coleccion, b: Coleccion) => {
          if (a.tipo === "favoritos") return -1;
          if (b.tipo === "favoritos") return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        setColecciones(coleccionesOrdenadas); // actualiza el estado con la lista de colecciones
      } catch (err: any) { 
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchColecciones();
  }, [userPerfilId]); // se vuelve a ejecutar si cambia el userPerfilId (ej: al navegar a otro perfil)

  // Activa el modo edición sobre una colección puntual
  const handleEditar = (id: string) => {
    if (!esPropioPerfil) return; // resguardo extra: no se puede editar el perfil de otra persona
    const col = colecciones.find((c) => c.id === id); // busca la colección por id; si no existe, no hace nada
    if (!col) return; 
    setEditandoId(id);
    setNombreTemporal(col.nombre); // precarga el input con el nombre actual
  };

  // Guarda el nuevo nombre de la colección en la API
  const handleGuardar = async (id: string) => {
    if (!nombreTemporal.trim()) return; // no permite guardar un nombre vacío
    try {
      const res = await fetch(`/api/colecciones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombreTemporal }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar la colección");
      toast.success("Colección actualizada");

      // Actualiza el estado local sin volver a pedir toda la lista a la API:
      // recorre las colecciones y reemplaza solo el nombre de la que cambió
      setColecciones((prev) =>
        prev.map((col) => (col.id === id ? { ...col, nombre: data.nombre } : col)) // reemplaza solo la colección editada
      );
      setEditandoId(null); // sale del modo edición
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "No se pudo actualizar la colección");
    }
  };

  // Elimina una colección (llamado desde MenuAccionesColecciones, luego de confirmar en el ConfirmDialog)
  const handleEliminar = async (id: string) => {
    if (!esPropioPerfil) return; // no se puede eliminar en perfil ajeno

    // la colección de "favoritos" nunca se puede eliminar
    const coleccion = colecciones.find(c => c.id === id);
    if (coleccion?.tipo === "favoritos") {
      toast.error("No puedes eliminar la carpeta de Favoritos");
      return;
    }

    try {
      const res = await fetch(`/api/colecciones/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al eliminar la colección");
      toast.success("Colección eliminada");

      // Actualiza el estado local quitando la colección eliminada, sin recargar todo
      setColecciones((prev) => prev.filter((col) => col.id !== id));
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "No se pudo eliminar la colección");
    }
  };

  // Estados de carga, error, y lista vacía
  if (loading) return <SkeletonColeccionesUsuario />;
  if (error) return <p className="text-center text-red-500">{error}</p>;
  if (colecciones.length === 0)
    return <p className="text-center text-gray-400">No hay colecciones para este usuario.</p>;

  return (
    // Grilla 
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 p-4">
      {colecciones.map((col) => (
        <div
          key={col.id}
          className="relative flex flex-col items-start justify-between p-6 rounded-2xl shadow-md border border-gray-200 bg-white hover:shadow-lg transition-shadow duration-200 cursor-pointer"
          onClick={() => router.push(`/colecciones/${col.id}`)} // toda la tarjeta navega al detalle de la colección
        >
          {/* Fila superior: fecha de creación + menú de acciones */}
          <div className="flex justify-between items-center w-full text-sm font-semibold text-gray-500 mb-2">
            <span>
              {new Date(col.created_at).toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>

            {/* El menú de 3 puntos solo aparece si:
                - es el propio perfil del usuario (no se puede editar/eliminar colecciones ajenas)
                - la colección NO es la de "favoritos" (esa está protegida y no tiene menú directamente) */}
            {esPropioPerfil && col.tipo !== "favoritos" && (
              <MenuAccionesColecciones
                coleccionId={col.id}
                onEditar={handleEditar}
                onEliminar={handleEliminar}
              />
            )}
          </div>

          {/* Nombre de la colección: si está en modo edición, muestra un input;
              si no, muestra el texto normal */}
          {editandoId === col.id ? (
            <input
              aria-label="nombre coleccion"
              type="text"
              value={nombreTemporal}
              onChange={(e) => setNombreTemporal(e.target.value)}
              onBlur={() => handleGuardar(col.id)} // guarda automáticamente al perder el foco (clickear afuera)
              onKeyDown={(e) => e.key === "Enter" && handleGuardar(col.id)} // o al presionar Enter
              autoFocus // pone el foco en el input automáticamente al entrar en modo edición
              className="w-full text-2xl font-semibold text-[#003c71] mt-2 mb-4 border-b-2 border-blue-500 focus:outline-none bg-transparent"
            />
          ) : (
            <h3 className="text-2xl font-semibold text-[#003c71] mt-2 mb-4 text-left">
              {col.nombre}
            </h3>
          )}
        </div>
      ))}
    </div>
  );
}