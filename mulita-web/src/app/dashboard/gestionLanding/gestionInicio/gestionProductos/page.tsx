"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/queries";

// Definimos la interfaz para un producto, que incluye su id, nombre y si se muestra en inicio
interface Producto {
  id: number;
  nombre: string;
  mostrar_en_inicio: boolean;
}

// Definimos la función para la página de gestión de productos, que incluye la lista de productos y la funcionalidad para marcar/desmarcar si se muestran en inicio
export default function GestionProductosPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingProductos, setLoadingProductos] = useState(true);

  // Traer productos desde la API
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const res = await fetch("/api/productos");
        const data = await res.json();
        const productosArray = Array.isArray(data) ? data : (data?.productos || []); // Asegurarse de que data sea un array
        setProductos(productosArray.reverse()); // Invertir el orden de los productos para mostrar el más reciente primero
      } catch (err) {
        console.error("Error fetching productos:", err);
        setProductos([]);
      } finally {
        setLoadingProductos(false);
      }
    };
    fetchProductos();
  }, []);

  // Marcar/desmarcar producto para mostrar en inicio
  const togglemostrar_en_inicio = async (producto: Producto) => {
    try {
      const res = await fetch(`/api/inicio/productos/${producto.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Error actualizando producto");

      // Actualizar estado local
      const updated = await res.json(); // Obtener la respuesta del backend después del PATCH
      console.log("respuesta del patch: ", updated); // Imprimir la respuesta en la consola

      setProductos((prev) =>
        prev.map((n) => (n.id === producto.id ? updated[0] : n)) // Actualizar el producto específico en el estado local
      );
    } catch (err) {
      console.error(err);
      alert("No se pudo actualizar el estado de la producto");
    }
  };

  if (isUserLoading || loadingProductos) {
    return <p className="text-center mt-10">Cargando productos...</p>;
  }

  return (
    <div className="w-full min-h-screen relative overflow-hidden flex flex-col items-center px-4 sm:px-6 pb-10 box-border font-inter">
      {/* Header + botón agregar */}
      <div className="w-full max-w-[1103px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
        <div className="flex flex-col text-[28px] sm:text-[32px] md:text-[36px]">
          <h1 className="leading-tight font-extrabold text-black">
            Gestión Productos
          </h1>
          <p className="mt-2 text-left text-sm sm:text-base leading-6 text-[#6d758f]">
            Gestiona los productos que serán visibles en el incio.
          </p>
        </div>
      </div>

      {/* Lista de productos */}
      <div className="flex-1 w-full max-w-[1100px] mt-6 flex flex-col gap-4">
        {productos.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">
            No hay productos disponibles.
          </p>
        ) : (
          productos.map((producto, index) => ( // Renderizamos cada producto en la lista
            <div
              key={producto.id ?? index} // fallback por si id es undefined
              className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6 bg-white border border-[#e1e4ed] rounded-lg shadow-sm hover:shadow-md transition"
            >
              <div className="text-base sm:text-lg font-semibold text-black break-words">
                {producto.nombre}
              </div>

              <div className="flex gap-2 items-center">
                <button
                  className={`py-1 px-3 rounded-md text-sm font-semibold ${
                    producto.mostrar_en_inicio
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-black"
                  } hover:opacity-80 transition`}
                  onClick={() => togglemostrar_en_inicio(producto)}
                >
                  {producto.mostrar_en_inicio
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
