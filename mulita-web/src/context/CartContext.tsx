"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

// Tipos de datos para los items
export interface CartItem {
  id: string;
  producto_id: string;
  carrito_id: string;
  cantidad: number;
  precio: number;
  producto?: {
    id: string;
    nombre: string;
    descripcion?: string;
    imagen?: string;
    precio: number;
  };
}
// Tipos de datos para el carrito
export interface Cart {
  id: string;
  usuario_id: string;
  total: number;
  cantidad_items: number;
  items: CartItem[];
  creado_en: string;
  actualizado_en: string;
}
// Tipos de datos para el contexto del carrito
interface CartContextType {
  cart: Cart | null;
  items: CartItem[]; 
  loading: boolean;
  error: string | null;
  // funciones para manejar el carrito
  addItem: (productoId: string, cantidad: number, precio: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateItemQuantity: (itemId: string, cantidad: number) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
  // funciones para obtener totales
  getTotalPrice: () => number;
  getTotalItems: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined); // Contexto del carrito

// Proveedor del contexto del carrito
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch cart del usuario, pide el carrito al backend y actualiza el estado del contexto
  const fetchCart = async () => {
    try {
      setLoading(true); // activa el estado de loading
      setError(null); // limpia cualquier error previo
      const res = await fetch("/api/carrito", {
        method: "GET",
        credentials: "include",
      });

      if (res.ok) { // Si la respuesta es exitosa, actualiza el estado del carrito y los items
        const data = await res.json();
        console.log("Cart data received:", data);
        setCart(data.carrito);
        setItems(data.items || []);
      } else if (res.status === 401) { // Si el usuario no está autenticado, limpia el carrito y los items
        console.warn("No autorizado al cargar carrito");
        setCart(null);
        setItems([]);
      } else if (res.status === 404) { // Si no hay carrito, limpia el carrito y los items
        setCart(null); 
        setItems([]);
      } else { // Si hay otro error, muestra un mensaje de error
        console.error("Error fetching cart:", res.status, res.statusText);
        setError(`Error al cargar carrito: ${res.status}`);
      }
    } catch (err) { 
      console.error("Error fetching cart:", err);
      setError("Error al cargar el carrito");
    } finally { // Finalmente, desactiva el estado de loading
      setLoading(false);
    }
  };

  // Agregar item al carrito
  const addItem = async (productoId: string, cantidad: number, precio: number) => {
    try {
      setLoading(true); // activa el estado de loading
      // Pide al backend agregar el item al carrito
      const res = await fetch("/api/carrito", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          producto_id: productoId,
          cantidad,
          precio,
        }),
      });

      if (res.ok) { // Si la respuesta es exitosa, actualiza el estado del carrito y los items
        const data = await res.json();
        if (data.items) { // Si hay items en la respuesta, actualiza el estado de items y carrito
          setItems(data.items);
          if (data.carrito) { // 
            setCart(data.carrito);
          }
        } else { // Si no hay items en la respuesta, vuelve a pedir el carrito al backend
          await fetchCart();
        }
      } else { // Si la respuesta no es exitosa, maneja el error
        try { // Intenta leer el cuerpo de la respuesta como JSON para obtener un mensaje de error más detallado
          const errorData = await res.json();
          console.error("Error response:", res.status, errorData);
          throw new Error(errorData.error || `Error ${res.status}`);
        } catch {
          console.error("Error response:", res.status, res.statusText);
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }
      }
    } catch (err) { // Si hay un error en la petición, muestra un mensaje de error y lanza el error para que pueda ser manejado por el componente que llama a esta función
      console.error("Error adding item:", err);
      const message = err instanceof Error ? err.message : "Error al agregar item al carrito";
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar item del carrito
  const removeItem = async (itemId: string) => {
    try { 
      setLoading(true);
      // Pide al backend eliminar el item del carrito
      const res = await fetch(`/api/carrito/${itemId}`, {
        method: "DELETE",
        credentials: "include",
      });
 
      if (res.ok) { // Si la respuesta es exitosa, actualiza el estado del carrito y los items
        const data = await res.json();
        if (data.items) {
          setItems(data.items);
        } else {
          await fetchCart();
        }
      } else {
        throw new Error("Error al eliminar item");
      }
    } catch (err) { // Si hay un error en la petición, muestra un mensaje de error y lanza el error para que pueda ser manejado por el componente que llama a esta función
      console.error("Error removing item:", err);
      setError("Error al eliminar item");
      toast.error("Error al eliminar producto del carrito");
    } finally {
      setLoading(false);
    }
  };

  // Actualizar cantidad de item
  const updateItemQuantity = async (itemId: string, cantidad: number) => {
    try {
      setLoading(true);
      // Pide al backend actualizar la cantidad del item en el carrito
      const res = await fetch(`/api/carrito/${itemId}`, {
        method: "PUT",
        credentials: "include",
        headers: { // Especifica el tipo de contenido en los encabezados
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cantidad }), // Envía la nueva cantidad en el cuerpo de la petición
      });

      if (res.ok) { // Si la respuesta es exitosa, actualiza el estado del carrito y los items
        const data = await res.json();
        if (data.items) {
          setItems(data.items);
        } else {
          await fetchCart();
        }
      } else {
        throw new Error("Error al actualizar cantidad");
      }
    } catch (err) { // Si hay un error en la petición, muestra un mensaje de error y lanza el error para que pueda ser manejado por el componente que llama a esta función
      console.error("Error updating quantity:", err);
      setError("Error al actualizar cantidad");
      toast.error("Error al actualizar cantidad");
    } finally {
      setLoading(false);
    }
  };

  // Vaciar carrito
  const clearCart = async () => {
    try {
      setLoading(true);
      // Pide al backend vaciar el carrito
      const res = await fetch("/api/carrito", {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) { // Si la respuesta es exitosa, limpia el estado del carrito y los items
        setCart(null);
        setItems([]);
      } else { // Si la respuesta no es exitosa, maneja el error
        throw new Error("Error al vaciar carrito");
      }
    } catch (err) { // Si hay un error en la petición, muestra un mensaje de error y lanza el error para que pueda ser manejado por el componente que llama a esta función
      console.error("Error clearing cart:", err);
      setError("Error al vaciar carrito");
      toast.error("Error al vaciar el carrito");
    } finally {
      setLoading(false);
    }
  };

  // Calcular precio total
  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.precio * item.cantidad, 0);
  };

  // Calcular cantidad total de items
  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.cantidad, 0);
  };

  // Fetch cart al montar, apenas entra la app, intenta cargar el carrito del usuario actual.
  useEffect(() => {
    fetchCart();
  }, []);

  return (
    <CartContext.Provider // Proporciona el contexto del carrito a los componentes hijos
      value={{
        cart,
        items,
        loading,
        error,
        addItem,
        removeItem,
        updateItemQuantity,
        clearCart,
        fetchCart,
        getTotalPrice,
        getTotalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() { // Hook para usar el contexto del carrito en los componentes hijos
  const context = useContext(CartContext); // Obtiene el contexto del carrito
  if (context === undefined) { // Si el contexto es undefined, significa que el hook se está usando fuera del proveedor del carrito, por lo que lanza un error.
    throw new Error("useCart debe ser usado dentro de CartProvider");
  }
  return context; // Devuelve el contexto del carrito
}
