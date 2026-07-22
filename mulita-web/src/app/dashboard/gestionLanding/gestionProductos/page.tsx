"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useUser } from "@/hooks/queries";
import MenuAccionesProductos from "@/components/ui/tienda/MenuAccionesProductos";

// Definimos la interfaz para un producto, que incluye su id, nombre y tipo de producto
interface Producto {
  id: number;
  nombre: string;
  tipo_producto?: string;
}

// Tipos de productos disponibles
const TIPOS_PRODUCTOS = [
  { id: "kit", nombre: "Kit", color: "text-blue-800", bgColor: "bg-blue-100" },
  { id: "pieza", nombre: "Pieza", color: "text-green-800", bgColor: "bg-green-100" },
  { id: "capacitacion", nombre: "Capacitación", color: "text-purple-800", bgColor: "bg-purple-100" }
];

// Definimos la función para la página de gestión de productos, que incluye la lista de productos 
// y la funcionalidad para filtrar por tipo de producto y eliminar productos
export default function GestionproductosPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [tipoSeleccionado, setTipoSeleccionado] = useState("");

  // Traer productos desde la API
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        setLoadingProductos(true);
        let url = "/api/productos";
        if (tipoSeleccionado) {
          url += `?tipo_producto=${tipoSeleccionado}`; // Si hay un tipo seleccionado, agregamos el parámetro a la URL
        }
        const res = await fetch(url); // Hacemos la petición a la API para obtener los productos
        const data = await res.json();
        const productosArray = Array.isArray(data) ? data : (data?.productos || []); // Aseguramos que sea un array
        setProductos(productosArray.reverse()); // Las más recientes primero
      } catch (err) {
        console.error("Error fetching productos:", err);
        setProductos([]);
      } finally {
        setLoadingProductos(false);
      }
    };
    fetchProductos();
  }, [tipoSeleccionado]); // Llamamos a la función para traer los productos al montar el componente y cada vez que cambie el tipo seleccionado

  const handleEliminar = async (id: number) => {
    try {
      await fetch(`/api/productos/${id}`, { method: "DELETE" });
      setProductos((prev) => prev.filter((n) => n.id !== id)); // Actualizamos el estado para eliminar el producto de la lista
      toast.success("Producto eliminado exitosamente");
      setConfirmDelete(null); // Cerramos el diálogo de confirmación
    } catch (err) {
      console.error("Error eliminando producto:", err);
      toast.error("Error al eliminar el producto");
    }
  };

  // Función para abrir el diálogo de confirmación de eliminación, no se usa porque el diálogo se abre directamente al hacer click en eliminar, pero la dejamos por si se necesita en el futuro
  const handleOpenConfirmDelete = (id: number) => {
    setConfirmDelete(id);
  };

  // Renderizamos un mensaje de carga mientras se obtienen los datos del usuario o los productos
  if (isUserLoading || loadingProductos) {
    return <p className="text-center mt-10">Cargando productos...</p>;
  }

  return (
    <>
      <ConfirmDialog
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        title="Eliminar producto"
        message="¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous={true}
        onConfirm={() => {
          if (confirmDelete !== null) handleEliminar(confirmDelete);
        }}
      />
      <div className="w-full min-h-screen relative overflow-hidden flex flex-col items-center px-4 sm:px-6 pb-10 box-border font-inter">
      {/* Header + botón agregar */}
      <div className="w-full max-w-[1103px] flex flex-col gap-4 mt-6">
        <div className="flex flex-col text-[28px] sm:text-[32px] md:text-[36px]">
          <h1 className="leading-tight font-extrabold text-black">
            Gestión productos
          </h1>
          <p className="mt-2 text-left text-sm sm:text-base leading-6 text-[#6d758f]">
            Gestiona las productos creadas o crea una nueva.
          </p>
        </div>

        {/* Filtro y botón agregar */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          {/* Selector de tipo de producto */}
          <select
            aria-label="tipo"
            value={tipoSeleccionado}
            onChange={(e) => setTipoSeleccionado(e.target.value)}
            className="w-full sm:w-64 border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          >
            <option value="">Todos los tipos</option>
            {TIPOS_PRODUCTOS.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </select>

          {(user?.rol === "admin" || user?.rol === "superAdmin") && (
            <Link
              href="/productos/crear"
              className="shadow-md rounded-md bg-[#f8faff] border border-[#e0e0e0] py-2 px-4 text-sm text-black font-semibold hover:bg-[#eef2ff] transition self-start sm:self-auto"
            >
              + Agregar
            </Link>
          )}
        </div>
      </div>

      {/* Lista de productos */}
      <div className="flex-1 w-full max-w-[1100px] mt-6 flex flex-col gap-4 mb-8">
        {productos.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">
            No hay productos disponibles.
          </p>
        ) : (
          productos.map((producto) => (
            <div
              key={producto.id}
              className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6 bg-white border border-[#e1e4ed] rounded-lg shadow-sm hover:shadow-md transition"
            >
              <div className="flex-1">
                <div className="text-base sm:text-lg font-semibold text-black break-words">
                  {producto.nombre}
                </div>
                {producto.tipo_producto && (
                  <div className="mt-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${TIPOS_PRODUCTOS.find(t => t.id === producto.tipo_producto)?.bgColor} ${TIPOS_PRODUCTOS.find(t => t.id === producto.tipo_producto)?.color}`}>
                      {TIPOS_PRODUCTOS.find(t => t.id === producto.tipo_producto)?.nombre || producto.tipo_producto}
                    </span>
                  </div>
                )}
              </div>

              {(user?.rol === "admin" || user?.rol === "superAdmin") && (
                <div className="self-end sm:self-auto">
                  <MenuAccionesProductos
                    productoId={producto.id}
                    onEliminar={handleEliminar}
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
