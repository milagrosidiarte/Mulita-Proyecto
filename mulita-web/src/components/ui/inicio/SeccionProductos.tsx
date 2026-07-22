"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProductoModal from "../tienda/ProductoModal"; // Componente modal para mostrar detalles del producto
import { SkeletonProductos } from "./skeletons/SkeletonProductos";
import { useUser } from "@/context/UserContext"; // Hook para obtener información del usuario
import { useRouter } from "next/navigation";
import CompraModal from "../tienda/CompraModal"; // Componente modal para realizar la compra de un producto
import { AddToCartButton } from "../tienda/carrito/AddToCartButton"; // Componente para agregar un producto al carrito de compras
import { toast } from "react-hot-toast"
import { CartItem } from "@/context/CartContext"; // Tipo para representar un ítem en el carrito de compras

// Tipos de datos para representar un archivo y un producto
export type Archivo = { archivo_url: string };
export type Producto = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  mostrar_en_inicio: boolean;
  producto_archivos: Archivo[];
};

// Componente principal que representa la sección de productos destacados en la página de inicio
export function SeccionProductos() {
  const [productos, setProductos] = useState<Producto[]>([]); // Estado para almacenar los productos obtenidos desde la API
  const [modalOpen, setModalOpen] = useState(false); // Estado para controlar la visibilidad del modal de detalles del producto
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null); // Estado para almacenar el producto actualmente seleccionado para mostrar en el modal

  const [compraOpen, setCompraOpen] = useState(false); // Estado para controlar la visibilidad del modal de compra
  const [productoCompra, setProductoCompra] = useState<Producto | null>(null); // Estado para almacenar el producto seleccionado para la compra

  const [loadingProductos, setLoadingProductos] = useState(true); // Estado para indicar si los productos están siendo cargados desde la API

  const { user } = useUser();
  const router = useRouter();

  // Efecto que se ejecuta al montar el componente para obtener los productos destacados desde la API
  useEffect(() => {
    const fetchProductos = async () => {
      setLoadingProductos(true);
      try {
        const res = await fetch("/api/inicio/productos");
        const data = await res.json();
        setProductos(data ?? []);
      } catch (err) {
        console.error("Error al obtener productos destacados:", err);
      } finally {
        setLoadingProductos(false);
      }
    };
    fetchProductos();
  }, []); // Se ejecuta solo una vez al montar el componente

  if (loadingProductos) {
    return <SkeletonProductos />;
  }

  // Función para abrir el modal de detalles del producto, 
  // estableciendo el producto seleccionado y mostrando el modal
  const abrirModal = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setModalOpen(true);
  };

  // Función para cerrar el modal de detalles del producto,
  // ocultando el modal y limpiando el producto seleccionado
  const cerrarModal = () => {
    setModalOpen(false);
    setProductoSeleccionado(null);
  }

  // Función para abrir el modal de compra, verificando si el usuario está autenticado
  const abrirModalCompra = (producto: Producto) => {
    if (!user) {
      toast.error("Debes iniciar sesión para poder comprar");
      setTimeout(() => {
        router.push("/auth/login");
      }, 1500);
      return;
    }
    setProductoCompra(producto);
    setCompraOpen(true);
  }; 

  // Item único para comprar directamente
  const itemUnico: CartItem | null = productoCompra
    ? {
      id: crypto.randomUUID(), // Genera un ID único para el ítem de compra
      producto_id: productoCompra.id,
      carrito_id: "direct-purchase", // Identificador especial para indicar que es una compra directa
      cantidad: 1,
      precio: productoCompra.precio,
      producto: {
        id: productoCompra.id,
        nombre: productoCompra.nombre,
        descripcion: productoCompra.descripcion,
        imagen: "", 
        precio: productoCompra.precio,
      },
    }
  : null; // Si no hay un producto seleccionado para la compra, itemUnico será null

  if (productos.length === 0) {
    return (
      <section className="mt-24 text-center">
        <p className="text-muted-foreground">
          No hay productos destacados por el momento.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Encabezado */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-[#003c71]">Productos</h2>
          <p className="text-gray-500 max-w-xl mx-auto mt-4">
            Herramientas y recursos ideales para tu institución.
          </p>
          <div className="w-16 h-1 bg-yellow-400 mx-auto mt-4 rounded-full"></div>
        </div>

        {/* GRID */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(280px,280px))] gap-6 justify-center">
          {productos.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-light bg-card p-5 flex flex-col shadow-sm hover:shadow-lg transition"
              onClick={() => abrirModal(p)}
            >
              {/* Imagen con precio encima */}
              <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                
                {/* Precio */}
                <span className="absolute top-3 right-3 bg-white text-[#003C71] font-bold px-3 py-1 rounded-md shadow-md z-10">
                  ${p.precio}
                </span>

                {/* Imagen */}
                {p.producto_archivos?.[0] ? (
                  <img
                    src={p.producto_archivos[0].archivo_url}
                    alt={p.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200"></div>
                )}
              </div>

              {/* Texto */}
              <div className="mt-4 flex-1">
                <h3 className="font-semibold text-[#003C71] text-lg">
                  {p.nombre}
                </h3>

                <p className="mt-2 text-sm text-gray-600 line-clamp-3">
                  {p.descripcion}
                </p>
              </div>

              {/* Botones */}
              <div className="mt-4 flex gap-2">
                <button
                  className="btn btn--blue flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    abrirModalCompra(p);
                  }}
                >
                  Comprar
                </button>

                <div onClick={(e) => e.stopPropagation()}>
                  <AddToCartButton 
                    productoId={p.id}
                    nombre={p.nombre}
                    precio={p.precio}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Botón ver más */}
        <div className="mt-8 flex justify-center">
          <Link href="/tienda" className="btn btn--blue">
            Ver todos los productos
          </Link>
        </div>

        {/* MODAL DE PRODUCTO */}
        <ProductoModal
          open={modalOpen}
          onClose={cerrarModal}
          producto={{
            id: productoSeleccionado?.id ?? "",
            nombre: productoSeleccionado?.nombre ?? "",
            descripcion: productoSeleccionado?.descripcion ?? "",
            precio: productoSeleccionado?.precio ?? 0,
            imagenes: productoSeleccionado?.producto_archivos?.map(a => a.archivo_url) ?? ["/placeholder.png"]
          }}
        />

        {/* MODAL DE COMPRA */}
        <CompraModal
          open={compraOpen}
          onClose={() => setCompraOpen(false)}
          items={itemUnico ? [itemUnico] : []}
        />
      </div>
    </section>
  );
}
