"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/queries";
import ProductoModal from "./ProductoModal";
import { AddToCartButton } from "./carrito/AddToCartButton";
import CompraModal from "./CompraModal";
import { toast } from "react-hot-toast";
import { CartItem } from "@/context/CartContext";

// Define la forma de los datos que recibimos del backend para un producto y sus archivos asociados
export type Archivo = { archivo_url: string };

export type Producto = {
  id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  eliminado: boolean;
  created_at: string;
  mostrar_en_inicio: boolean;
  producto_archivos: Archivo[];
};


export default function Productos({ productos, initialProductId }: { productos: Producto[], initialProductId?: string | null }) {
  // controlan si el modal de detalle de producto está abierto y cuál producto muestra.
  const [modalOpen, setModalOpen] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  // controlan si el modal de compra está abierto y cuál producto se va a comprar.  
  const [compraOpen, setCompraOpen] = useState(false);
  const [productoCompra, setProductoCompra] = useState<Producto | null>(null);
  // Obtiene el usuario actual y el router para redirecciones
  const { user } = useUser();
  const router = useRouter();

  // Cuando el componente carga y hay un initialProductId, abre el modal de ese producto
  useEffect(() => {
    if (initialProductId && productos.length > 0) { // Solo busca el producto si hay productos cargados
      const producto = productos.find(p => p.id === initialProductId); // Busca el producto con el ID inicial
      if (producto) { // Si encuentra el producto, lo selecciona y abre el modal
        setProductoSeleccionado(producto); // Establece el producto seleccionado
        setModalOpen(true); // Abre el modal
      }
    }
  }, [initialProductId, productos]); // Dependencias: se ejecuta cuando cambia initialProductId o productos

  // Funciones para abrir y cerrar modales
  const abrirModal = (producto: Producto) => { // Abre el modal de detalle de producto
    setProductoSeleccionado(producto); // Establece el producto seleccionado
    setModalOpen(true); // Abre el modal
  };
  // Cierra el modal de detalle de producto y limpia el producto seleccionado
  const cerrarModal = () => {
    setModalOpen(false);
    setProductoSeleccionado(null);
  }
  // Abre el modal de compra, pero primero verifica si el usuario está logueado
  const abrirModalCompra = (producto: Producto) => {
    if (!user) {
      toast.error("Debes iniciar sesión para poder comprar");
      setTimeout(() => { // Redirige al usuario a la página de login después de 1.5 segundos
        router.push("/auth/login");
      }, 1500);
      return;
    } // Si el usuario está logueado, establece el producto a comprar y abre el modal de compra
    setProductoCompra(producto); 
    setCompraOpen(true);
  };

  // Item único para comprar directamente
  const itemUnico: CartItem | null = productoCompra
    ? {
      id: crypto.randomUUID(), // Genera un ID único para el item del carrito
      producto_id: productoCompra.id, // ID del producto a comprar
      carrito_id: "direct-purchase", // ID del carrito para compras directas
      cantidad: 1, // Cantidad fija de 1 para compras directas
      precio: productoCompra.precio, // Precio del producto
      producto: { // Información del producto para mostrar en el modal de compra
        id: productoCompra.id,
        nombre: productoCompra.nombre,
        descripcion: productoCompra.descripcion,
        imagen: "",
        precio: productoCompra.precio,
      },
    }
  : null; // Si no hay producto seleccionado para compra, itemUnico es null
  
  // Renderiza un mensaje si no hay productos disponibles
  if (productos.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto text-center py-12">
        <p className="text-gray-500">No hay productos disponibles</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* GRID */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {productos.map((p) => ( // Itera sobre cada producto y renderiza su tarjeta
          <div
            key={p.id} // Usa el ID del producto como key para la lista
            className="rounded-xl border border-light bg-card p-5 flex flex-col shadow-sm hover:shadow-lg transition cursor-pointer"
            onClick={() => abrirModal(p)} // Al hacer click en la tarjeta, abre el modal de detalle del producto
          >
            {/* Imagen con precio encima */}
            <div className="relative w-full aspect-square rounded-lg overflow-hidden">
              
              {/* Precio dentro de la imagen */}
              <span className="absolute top-3 right-3 bg-white text-[#003C71] font-bold px-3 py-1 rounded-md shadow-md z-10">
                ${p.precio} 
              </span>

              {p.producto_archivos?.[0] ? ( // Si el producto tiene archivos asociados, muestra la primera imagen
                <img
                  src={p.producto_archivos[0].archivo_url} // Usa la URL del primer archivo como fuente de la imagen
                  alt={p.nombre} // Usa el nombre del producto como texto alternativo
                  className="w-full h-full object-cover" // Asegura que la imagen cubra todo el contenedor manteniendo su proporción
                />
              ) : ( // Si no hay archivos asociados, muestra un placeholder gris
                <div className="w-full h-full bg-gray-200"></div>
              )}
            </div>

            {/* Contenido */}
            
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
                  productoId={p.id} // Pasa el ID del producto al botón de agregar al carrito
                  nombre={p.nombre} // Pasa el nombre del producto al botón de agregar al carrito
                  precio={p.precio} // Pasa el precio del producto al botón de agregar al carrito
                /> 
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE PRODUCTO */}
      <ProductoModal
        open={modalOpen} // Indica si el modal de producto está abierto
        onClose={cerrarModal} // Función para cerrar el modal de producto
        producto={{ // Pasa la información del producto seleccionado al modal de producto
          id: productoSeleccionado?.id ?? "", // Si no hay producto seleccionado, usa valores por defecto
          nombre: productoSeleccionado?.nombre ?? "", 
          descripcion: productoSeleccionado?.descripcion ?? "", 
          precio: productoSeleccionado?.precio ?? 0, 
          imagenes: productoSeleccionado?.producto_archivos?.map(a => a.archivo_url) ?? ["/placeholder.png"] 
          // imagenes mapea todos los archivo_url del producto a un array de strings, 
          // o usa una imagen placeholder si no hay ninguna.
        }}
      />

      {/* MODAL DE COMPRA */}
      <CompraModal
        open={compraOpen} // Indica si el modal de compra está abierto
        onClose={() => setCompraOpen(false)} // Función para cerrar el modal de compra
        items={itemUnico ? [itemUnico] : []} // Pasa el item único al modal de compra si existe, de lo contrario pasa un array vacío
        source="product"// Indica que la fuente de la compra es un producto individual
      />
    </div>
  );
}
