import Header from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { UserProvider } from "@/context/UserContext";
import { CartProvider } from "@/context/CartContext";
// @ts-expect-error CSS module handled by Next.js
import "./globals.css";

import { Toaster } from "react-hot-toast";
import ProvidersWrapper from "@/components/ProvidersWrapper"; 
// un proveedor de contexto es un componente que envuelve a otros componentes y les proporciona acceso a un contexto específico, 
// permitiendo compartir datos y funciones entre ellos sin necesidad de pasar props manualmente a través de cada nivel del árbol de componentes.

// La función RootLayout es un componente de diseño que envuelve toda la aplicación, proporcionando una estructura HTML básica y envolviendo los componentes hijos con varios proveedores de contexto.
export const metadata = {
  title: "Mulita",
  description: "Comunidad y tienda oficial de Mulita",
};

// 
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="">
      <head>
      </head>
      <body className="bg-background text-foreground min-h-screen flex flex-col">
        <ProvidersWrapper> {/* Proporciona el contexto de React Query a toda la aplicación, permitiendo el uso de hooks como useQuery y useMutation en cualquier componente hijo. */}
          <CartProvider> {/* Proporciona el contexto del carrito de compras a toda la aplicación, permitiendo el acceso y la manipulación del estado del carrito desde cualquier componente hijo. */}
            <UserProvider> {/* Proporciona el contexto del usuario a toda la aplicación, permitiendo el acceso y la manipulación del estado del usuario desde cualquier componente hijo. */}
              {/* Top bar */}
              <Header /> 
              <main className="flex-1">{children}</main>
              <Toaster position="bottom-right" />
              <Footer />
            </UserProvider>
          </CartProvider>
        </ProvidersWrapper>
      </body>
    </html>
  );
}
