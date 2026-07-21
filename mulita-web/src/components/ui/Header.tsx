// componente principal del encabezado, se encarga de montar la barra superior de la web con 
// navegación, logo, menú de usuario y el estado de autenticación.
"use client";

import Link from "next/link";
import { useUser } from "@/hooks/queries";
import { usePathname } from "next/navigation";
import MenuAccionesHeaderPrincipal from "./MenuAccionesHeaderPrincipal";
import { CartIcon } from "@/components/ui/tienda/carrito/CartIcon";

// define el componente Header. Extrae el usuario actual usando el hook useUser 
// y la ruta actual usando usePathname.
export default function Header() {
  const { user } = useUser();
  const pathname = usePathname();

  // en esas pantallas no se muestra el header principal
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/noticias/crear") ||
    pathname.startsWith("/noticias/editar") || 
    pathname.startsWith("/perfil/editar")
  ) {
    return null;
  }

  // define los enlaces de navegación principales del header.
  // la URL (href) y el texto que se muestra (label)
  const navLinks = [
    { href: "/", label: "Inicio" },
    { href: "/noticias", label: "Noticias" },
    { href: "/comunidad", label: "Comunidad" },
    { href: "/tienda", label: "Tienda" },
    { href: "/sobreNosotros", label: "Sobre nosotros" },
  ];


  return (
    <header className="sticky top-0 z-[9999] bg-white/90 backdrop-blur border-b border-light">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img
            src="/images/logosMulita/logo Mulita-13.svg"
            alt="LogoMulita13"
            className="h-8 w-8 rounded-full object-contain"
          />
          <Link href="/" className="font-semibold tracking-tight">
            Mulita
          </Link>
        </div>

        {/* Links principales */}
        <ul className="hidden md:flex items-center gap-8 text-[15px]">
          {navLinks.map(({ href, label }) => {
            const active =
              pathname === href ||
              (href !== "/" && pathname.startsWith(href));

            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`transition-colors duration-200 ${
                    active
                      ? "text-[#fedd00] font-semibold"
                      : "hover:text-[#fedd00] text-gray-700"
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}

          {/* Botón Dashboard solo para admin o superAdmin*/}
          {(user?.rol === "admin" || user?.rol === "superAdmin") && (
            <li>
              <Link href="/dashboard" className="btn btn--yellow">
                Dashboard
              </Link>
            </li>
          )}
        </ul>

        {/* Acciones (registro/login o menú usuario) */}
        <div className="flex items-center gap-4">
          {!user ? ( // Si no hay usuario logueado (!user), muestra los botones de Registro y Log In.
            <>
              <Link href="/auth/register" className="btn btn--yellow">
                Registro
              </Link>
              <Link href="/auth/login" className="btn btn--blue">
                Log In
              </Link>
            </>
          ) : ( // Si hay usuario logueado (user), muestra el ícono del carrito y el menú de acciones del usuario.
            <>
              <CartIcon />
              <MenuAccionesHeaderPrincipal />
            </>
          )}
        </div>
      </nav>
      <div className="h-[3px] w-full bg-primary" />
    </header>
  );
}
