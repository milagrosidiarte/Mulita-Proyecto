import { CarritoPage } from "@/components/ui/tienda/carrito/CarritoPage";
import { CartProvider } from "@/context/CartContext";

export default function Carrito() {
  return (
    <CartProvider> { /* Proporciona el contexto del carrito a todos los componentes hijos */ }
      <CarritoPage /> { /* Renderiza la página del carrito de compras */ }
    </CartProvider>
  );
}
