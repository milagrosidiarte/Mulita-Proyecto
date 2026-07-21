// detalle de producto, con carrusel de imágenes y botones de compra
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/queries";
import { AddToCartButton } from "./carrito/AddToCartButton";
import CompraModal from "./CompraModal";
import { toast } from "react-hot-toast";
import { CartItem } from "@/context/CartContext";

type ProductoModalProps = {
  open: boolean;
  onClose: () => void;
  producto: {
    id: string;
    nombre: string;
    descripcion: string;
    precio: number;
    imagenes: string[];
  };
};

export default function ProductoModal({ open, onClose, producto }: ProductoModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0); // Índice de la imagen actualmente mostrada en el carrusel
  const [compraOpen, setCompraOpen] = useState(false); // Controla si el modal de compra está abierto
  const { user } = useUser();
  const router = useRouter();

  // Efecto para bloquear el scroll del body cuando el modal está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = ""; // funcion de limpieza de useEffect para restaurar el scroll del body cuando el componente se desmonta
    };
  }, [open]);

  if (!open) return null; // Si el modal no está abierto, no renderiza nada

  // Función para manejar la compra directa del producto
  // si no hay usuario logueado, avisa y redirige a login; 
  // si hay usuario, abre el modal de compra.
  const handleComprar = () => {
    if (!user) {
      toast.error("Debes iniciar sesión para poder comprar");
      setTimeout(() => {
        router.push("/auth/login");
      }, 1500);
      return;
    }
    setCompraOpen(true);
  };

  // Item único para comprar directamente
  // construye siempre, porque en este componente producto nunca es null 
  // (si el modal está abierto, siempre hay un producto).
  const itemUnico: CartItem = {
    id: crypto.randomUUID(),
    producto_id: producto.id,
    carrito_id: "direct-purchase",
    cantidad: 1, // SIEMPRE 1, no hay selector de cantidad
    precio: producto.precio,
    producto: {
      id: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      imagen: "",
      precio: producto.precio,
    },
  };

  // retrocede el índice de la imagen. 
  // Si está en la primera (i === 0), salta a la última; si no, resta 1.
  const prev = () => {
    setCurrentIndex((i) => (i === 0 ? producto.imagenes.length - 1 : i - 1));
  };

  // avanza el índice. Si está en la última, vuelve a la primera; si no, suma 1.
  const next = () => {
    setCurrentIndex((i) => (i === producto.imagenes.length - 1 ? 0 : i + 1));
  };

  // verifica si el producto tiene más de una imagen para mostrar las flechas del carrusel
  const hasMultiple = producto.imagenes.length > 1;

  return (
    <div 
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] px-4 py-20"
      onClick={onClose}
    >
      <div
        className="
          relative bg-white rounded-lg flex justify-between items-center 
          overflow-hidden w-full max-w-[1100px] h-[612px] 
          p-[80px_0] gap-5 text-center text-[12px] text-[#6d758f] font-inter
        "
        onClick={(e) => e.stopPropagation()} //para que no se propage el click al div padre y cierre el modal
      >
        {/* BOTÓN CERRAR */}
        <button
          onClick={onClose}
          className="
            absolute top-[17px] left-[22px] z-20 
            cursor-pointer transition-transform duration-150 hover:scale-110
          "
          aria-label="Cerrar modal"
        >
          <img
            src="/images/icons/productos/cerrar.svg"
            alt="Cerrar"
            className="w-4 h-4"
          />
        </button>

        {/* COLUMNA IZQUIERDA */}
        {/* Muestra el nombre grande, el precio en una etiqueta destacada al lado, 
        y la descripción con scroll propio si es muy larga*/}
        <div
          className="
            w-[467px] flex flex-col items-start absolute
            top-1/2 -translate-y-1/2 left-[calc(50%-495.5px)]
            max-h-[440px] pr-4
          "
        >
          <div className="flex items-center gap-4">
            <h1 className="text-[48px] leading-[48px] font-extrabold text-[#003c71] text-left">
              {producto.nombre}
            </h1>

            <span className="text-[28px] font-bold text-[#003c71] bg-[#e8edf3] px-4 py-1 rounded-md">
              ${producto.precio}
            </span>
          </div>


          <div className="mt-4" />

          <div className="mt-4 max-h-[200px] overflow-y-auto pr-2">
            <p className="text-left text-[16px] leading-6">
              {producto.descripcion}
            </p>
          </div>

          <div className="mt-6" />

          {/* BOTONES */}
          <div className="flex items-center gap-4 text-[16px] text-white mt-4">
            <button
              className="
                bg-[#003c71] shadow-[0px_1px_4px_rgba(25,33,61,0.08)]
                rounded-md px-[28px] py-[10px] 
                flex items-center justify-center gap-[6px]
                cursor-pointer font-semibold flex-1
                transition-all duration-200
                hover:bg-[#004a8d] hover:scale-[1.02] hover:shadow-md
              "
              onClick={handleComprar}
            >
              Comprar
              <img
                src="/images/icons/productos/flecha.svg"
                width={14}
                height={14}
                alt="Ir"
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </button>

            <div onClick={(e) => e.stopPropagation()}>
              <AddToCartButton 
                productoId={producto.id}
                nombre={producto.nombre}
                precio={producto.precio}
              />
            </div>
          </div>
        </div>

        {/* IMAGEN DERECHA + FLECHAS */}
        <div
          className="
            absolute top-[calc(50%-226px)] left-[calc(50%+104.5px)]
            w-[390px] h-[452px] flex items-center justify-center
          "
        >
          {/* Flecha izquierda */}
          {hasMultiple && (
            <button
              onClick={prev}
              className="
                absolute left-[-40px] z-20 bg-white/70 hover:bg-white text-black border border-gray-300
                w-[32px] h-[32px] rounded-full shadow-md flex items-center justify-center
                transition-all duration-200 hover:scale-110
              "
            >
              🡨
            </button>
          )}

          {/* Imagen actual */}
          <img
            src={producto.imagenes[currentIndex]}
            alt={producto.nombre}
            className="
              w-[390px] h-[452px] object-contain rounded-lg z-10
            "
          />

          {/* Flecha derecha */}
          {hasMultiple && (
            <button
              onClick={next}
              className="
                absolute right-[-40px] z-20 bg-white/70 hover:bg-white text-black border border-gray-300
                w-[32px] h-[32px] rounded-full shadow-md flex items-center justify-center
                transition-all duration-200 hover:scale-110
              "
            >
              🡪
            </button>
          )}
        </div>
      </div>

      {/* MODAL DE COMPRA */}
      <CompraModal
        open={compraOpen}
        onClose={() => setCompraOpen(false)}
        items={[itemUnico]}
        source="product"
      />
    </div>
  );
}
