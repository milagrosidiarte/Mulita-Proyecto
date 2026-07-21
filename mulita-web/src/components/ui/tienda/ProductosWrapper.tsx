"use client";

import Productos from "./Productos";
import SkeletonProductos from "./skeletons/SkeletonProductos";

// Definición de la interfaz Producto, que representa la estructura de un producto en la tienda.
interface Producto {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  imagen: string;
  eliminado: boolean;
  created_at: string;
  mostrar_en_inicio: boolean;
  producto_archivos: any[];
}

// Define qué props (parámetros) espera recibir este componente
interface ProductosWrapperProps {
  productos: Producto[];
  loading: boolean;
  initialProductId?: string | null;
}

export default function ProductosWrapper({ productos, loading, initialProductId }: ProductosWrapperProps) {
  // Si loading es true, renderiza un componente de carga (SkeletonProductos) mientras se obtienen los productos.
  if (loading) {
    return <SkeletonProductos />;
  }
  // Si loading es false, renderiza el componente real Productos, pasándole la lista de productos y el initialProductId.
  return <Productos productos={productos} initialProductId={initialProductId} />;
}
