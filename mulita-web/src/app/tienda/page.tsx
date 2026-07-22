"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductosWrapper from "@/components/ui/tienda/ProductosWrapper";

// Definición de la interfaz TipoProducto para tipar los datos de los tipos de productos
interface TipoProducto {
  id: string;
  nombre: string;
  color: string;
  bgColor: string;
}

// Definición de los tipos de productos disponibles en la tienda
const TIPOS_PRODUCTOS: TipoProducto[] = [
  { id: "kit", nombre: "Kit", color: "text-blue-800", bgColor: "bg-blue-100" },
  { id: "pieza", nombre: "Pieza", color: "text-green-800", bgColor: "bg-green-100" },
  { id: "capacitacion", nombre: "Capacitación", color: "text-purple-800", bgColor: "bg-purple-100" }
];

// Componente principal de la página de la tienda
function TiendaContent() {
  const searchParams = useSearchParams();
  const productIdFromUrl = searchParams.get("productId"); // Obtener el ID del producto desde los parámetros de búsqueda de la URL
  
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null); // Estado para manejar errores de carga no se usa porque no se muestra en la UI
  const [tipoSeleccionado, setTipoSeleccionado] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const limit = 12;

  // Función para traer productos desde la API con filtros y paginación
  const fetchProductos = async () => {
    setLoading(true);
    setError(null);
    try {
      let url = `/api/productos?page=${page}&limit=${limit}`; // URL base para la API de productos con paginación
      if (tipoSeleccionado) { // Agregar filtro de tipo de producto si se ha seleccionado uno
        url += `&tipo_producto=${tipoSeleccionado}`; 
      }
      if (busqueda.trim()) { // Agregar filtro de búsqueda si hay texto en la barra de búsqueda
        url += `&busqueda=${encodeURIComponent(busqueda.trim())}`;
      }
      const res = await fetch(url);
      const data = await res.json();

      setProductos(data?.productos || []); // Asegurarse de que la respuesta tenga la estructura esperada
      setTotal(data?.total || 0); // Asegurarse de que la respuesta tenga la estructura esperada
    } catch (err) {
      console.error("Error fetching productos:", err);
      setError("Error al cargar productos");
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
  }, [page, tipoSeleccionado, busqueda]); // Refrescar productos cada vez que cambien la página, el tipo seleccionado o la búsqueda

  // Calcular el total de páginas para la paginación
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="w-full max-w-7xl mx-auto py-10 px-4">
      {/* Encabezado */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-[#003c71]">Productos</h2>
        <p className="text-gray-500 max-w-xl mx-auto mt-4">
          Lorem ipsum dolor sit amet consectetur adipiscing elit tortor eu 
          egestas morbi sem vulputate etiam facilisis.
        </p>
      </div>

      {/* Filtro de tipos */}
      <div className="mb-8 flex flex-col gap-4 items-center justify-center">
        {/* Barra de búsqueda y filtro */}
        <div className="flex flex-col md:flex-row gap-4 w-full max-w-2xl">
          {/* Barra de búsqueda */}
          <input
            type="text"
            placeholder="Buscar productos por nombre..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPage(1); // Reiniciar paginación al buscar
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />

          {/* Filtro de tipos */}
          <select
            value={tipoSeleccionado}
            onChange={(e) => {
              setTipoSeleccionado(e.target.value);
              setPage(1); // Reiniciar paginación al cambiar filtro
            }}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none md:w-auto"
          >
            <option value="">Todos los tipos</option>
            {TIPOS_PRODUCTOS.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Productos con skeleton integrado */}
      <ProductosWrapper 
        productos={productos} 
        loading={loading}
        initialProductId={productIdFromUrl}
      />

      {/* Paginación */}
      <div className="flex justify-center gap-4 my-10">

        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
        >
          Anterior
        </button>

        <span className="text-lg font-medium">
          {page} / {totalPages || 1}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
        >
          Siguiente
        </button>

      </div>
    </div>
  );
}

export default function TiendaPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-7xl mx-auto py-10 px-4">Cargando...</div>}>
      <TiendaContent />
    </Suspense>
  );
}
