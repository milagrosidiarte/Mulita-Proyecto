"use client";

import { useEffect, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useUser } from "@/hooks/queries";

interface Categoria {
  id: string;
  nombre: string;
  tipo?: "curso" | "dificultad" | "materia";
}

export default function GestionCategoriasPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(true);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<"curso" | "dificultad" | "materia">("curso");
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<"" | "curso" | "dificultad" | "materia">("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Traer categorías desde la API
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await fetch("/api/categorias");
        const data = await res.json();
        const categoriasArray = Array.isArray(data) ? data : (data?.categorias || []); // Asegurarse de que data es un array
        setCategorias(categoriasArray.reverse()); // Invertir el orden para mostrar las categorías más recientes primero
      } catch (err) {
        console.error("Error fetching categorias:", err);
        setCategorias([]);
      } finally {
        setLoadingCategorias(false); // Asegurarse de que el estado de carga se actualice incluso si hay un error
      }
    };
    fetchCategorias(); // Llamar a la función para traer categorías al montar el componente
  }, []);

  // Manejar la creación de una nueva categoría
  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevenir el comportamiento por defecto del formulario
    if (!nombre.trim()) return; // No permitir nombres vacíos
    try {
      const res = await fetch("/api/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, tipo }),
      });
      if (!res.ok) throw new Error("Error al crear categoría");
      const nueva = await res.json();
      setCategorias((prev) => [nueva, ...prev]); // Agregar la nueva categoría al inicio del array para que aparezca primero
      setNombre(""); // Limpiar el input de nombre después de crear la categoría
      setTipo("curso"); // Resetear el tipo a "curso" después de crear una categoría
    } catch (err) {
      console.error("Error creando categoría:", err);
    }
  };

  // Manejar la eliminación de una categoría
  const handleEliminar = async (id: string) => {
    try {
      const res = await fetch(`/api/categorias`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Error al eliminar categoría");
      setCategorias((prev) => prev.filter((c) => c.id !== id)); // Filtrar la categoría eliminada
      setConfirmDelete(null); // Cerrar el diálogo de confirmación después de eliminar
    } catch (err) {
      console.error("Error eliminando categoría:", err);
    }
  };

  if (isUserLoading || loadingCategorias) {
    return <p className="text-center mt-10">Cargando categorías...</p>;
  }

  return (
    <>
      <ConfirmDialog
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Eliminar categoría"
        message="¿Estás seguro de que deseas eliminar esta categoría? Esta acción no se puede deshacer."
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
            Gestión de Categorías
          </h1>
          <p className="mt-2 text-left text-sm sm:text-base leading-6 text-[#6d758f]">
            Crea nuevas categorías o administra las existentes.
          </p>
        </div>

        {(user?.rol === "admin" || user?.rol === "superAdmin") && (
          <form
            onSubmit={handleCrear}
            className="flex gap-2 shadow-md rounded-md bg-[#f8faff] border border-[#e0e0e0] p-2"
          >
            <select
              aria-label="categoria"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as "curso" | "dificultad" | "materia")}
              className="px-2 py-1 border border-[#ccc] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="curso">Curso</option>
              <option value="dificultad">Dificultad</option>
              <option value="materia">Materia</option>
            </select>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre de la categoría"
              className="px-2 py-1 border border-[#ccc] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              required
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-1 rounded-md text-sm font-semibold hover:bg-blue-700 transition"
            >
              + Agregar
            </button>
          </form>
        )}
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="w-full max-w-[1103px] mt-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)} // Actualizar el estado de búsqueda al cambiar el input
          placeholder="Buscar categoría..."
          className="flex-1 px-4 py-3 border border-[#ccc] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
        />
        <select
          aria-label="categoria"
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value as "" | "curso" | "dificultad" | "materia")}
          className="sm:w-48 px-4 py-3 border border-[#ccc] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
        >
          <option value="">Todos los tipos</option>
          <option value="curso">Curso</option>
          <option value="dificultad">Dificultad</option>
          <option value="materia">Materia</option>
        </select>
      </div>

      {/* Lista de categorías */}
      <div className="flex-1 w-full max-w-[1100px] mt-6 flex flex-col gap-4">
        {categorias // Filtrar categorías según la búsqueda y el filtro de tipo
          .filter((c) =>
            c.nombre.toLowerCase().includes(busqueda.toLowerCase()) // Filtrar por búsqueda
          )
          .filter((c) => (filtroTipo ? c.tipo === filtroTipo : true)) // Aplicar filtro de tipo si se selecciona uno
          .length === 0 ? (
          <p className="text-center text-gray-500 mt-10">
            {categorias.length === 0
              ? "No hay categorías disponibles."
              : "No hay categorías que coincidan con la búsqueda o filtro."}
          </p>
        ) : (
          categorias
            .filter((c) => 
              c.nombre.toLowerCase().includes(busqueda.toLowerCase())
            )
            .filter((c) => (filtroTipo ? c.tipo === filtroTipo : true)) // Aplicar filtro de tipo si se selecciona uno
            .map((categoria) => ( // Mapear las categorías filtradas a elementos JSX
              <div
                key={categoria.id}
                className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6 bg-white border border-[#e1e4ed] rounded-lg shadow-sm hover:shadow-md transition"
              >
                <div className="flex-1">
                  <div className="text-base sm:text-lg font-semibold text-black break-words">
                    {categoria.nombre}
                  </div>
                  {categoria.tipo && (
                    <div className="mt-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        categoria.tipo === "curso" ? "bg-blue-100 text-blue-700" :
                        categoria.tipo === "dificultad" ? "bg-orange-100 text-orange-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {categoria.tipo.charAt(0).toUpperCase() + categoria.tipo.slice(1)}
                      </span>
                    </div>
                  )}
                </div>
                
                {(user?.rol === "admin" || user?.rol === "superAdmin") && ( // Si es admin o superAdmin puede eliminar una categoria
                  <button
                    onClick={() => setConfirmDelete(categoria.id)}
                    className="self-end sm:self-auto bg-red-600 text-white px-3 py-1 rounded-md text-sm font-semibold hover:bg-red-700 transition"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            ))
        )}
      </div>
      </div>
    </>
  );
}
