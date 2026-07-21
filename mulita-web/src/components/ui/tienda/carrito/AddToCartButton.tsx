"use client";

import { useCart, useUser } from "@/hooks/queries";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { toast } from "react-hot-toast";

// los props sirven para pasar información al componente, en este caso el id del producto, el nombre y el precio
interface AddToCartButtonProps {
  productoId: string;
  nombre: string;
  precio: number;
  className?: string; // Propiedad opcional para clases CSS adicionales
}

export function AddToCartButton({
  productoId,
  nombre,
  precio,
  className = "", // Valor por defecto para className
}: AddToCartButtonProps) {
  const { addItem, isAddingItem } = useCart(); // del hook useCart obtenemos la función addItem y el estado isAddingItem
  const { user } = useUser();
  const router = useRouter();
  const [cantidad, setCantidad] = useState(1); //en 1 fijo

  const handleAddToCart = () => {
    // Verificar si el usuario está logueado
    if (!user) {
      toast.error("Debes iniciar sesión para agregar productos al carrito");
      setTimeout(() => {
        router.push("/auth/login");
      }, 1500); // Redirigir al usuario a la página de login después de 1.5 segundos
      return; // Salir de la función si el usuario no está logueado
    }
 
    // si hay usuario llama a la función addItem del hook useCart, pasando el id del producto, la cantidad y el precio
    addItem(
      { productoId, cantidad, precio },
      {
        onSuccess: () => {
          toast.success(`"${nombre}" añadido al carrito`);
          setCantidad(1);
        },
        onError: (error) => {
          const message = error instanceof Error ? error.message : "Error al agregar al carrito";
          toast.error(message);
          console.error("Error al agregar al carrito:", error);
        },
      }
    );
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-4">
        <button
          onClick={handleAddToCart}
          disabled={isAddingItem}
          className="btn btn--outline flex-1"
        >
          <ShoppingCart className="w-5 h-5" />
          {isAddingItem ? "Agregando..." : "Carrito"}
        </button>
      </div>
    </div>
  );
}
