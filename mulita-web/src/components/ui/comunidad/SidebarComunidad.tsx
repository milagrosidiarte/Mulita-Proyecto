"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useUser } from "@/hooks/queries";

// SidebarComunidad es un componente que representa la barra lateral de la sección de comunidad. 
// Contiene enlaces a diferentes secciones como Foro, Crear, Colecciones y Favoritos. 
// La barra lateral se puede abrir y cerrar, y se adapta a dispositivos móviles mostrando un overlay cuando está abierta. 
// Además, resalta el enlace activo según la ruta actual y los parámetros de búsqueda.
export function SidebarComunidad({
  isOpen, // Indica si la barra lateral está abierta o cerrada
  onClose, // Función que se llama para cerrar la barra lateral
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams(); // Hook para obtener los parámetros de búsqueda de la URL
  const { user } = useUser();

  const handleLinkClick = () => { // Cuando se hace clic en un enlace, cerramos la barra lateral
    onClose();
  };

  // Si no hay usuario logueado, podemos poner un fallback
  const userId = user?.id || ""; // Obtenemos el ID del usuario logueado, si existe
 
  const links = [
    {
      href: "/comunidad",
      label: "Foro",
      icon: "/images/icons/comunidad/foro.svg",
      iconActive: "/images/icons/comunidad/foro.svg",
      isActive: () => pathname === "/comunidad",
    },
    {
      href: "/comunidad/actividades/crear",
      label: "Crear",
      icon: "/images/icons/comunidad/crear.svg",
      iconActive: "/images/icons/comunidad/crear.svg",
      isActive: () => pathname.startsWith("/comunidad/actividades/crear"),
    },
    {
      href: `/perfil/${userId}?vista=colecciones`,
      label: "Colecciones",
      icon: "/images/icons/comunidad/colecciones.svg",
      iconActive: "/images/icons/comunidad/colecciones.svg",
      isActive: () => {
        // Activo si estamos en la ruta del perfil del usuario y la query vista=colecciones
        const vista = searchParams.get("vista");
        return pathname === `/perfil/${userId}` && vista === "colecciones";
      },
    },
    {
      href: `/perfil/${userId}?vista=favoritos`,
      label: "Favoritos",
      icon: "/images/icons/comunidad/favoritos.svg",
      iconActive: "/images/icons/comunidad/favoritos.svg",
      isActive: () => {
        const vista = searchParams.get("vista");
        return pathname === `/perfil/${userId}` && vista === "favoritos";
      },
    },
    // {
    //   href: "/configuracion",
    //   label: "Configuración",
    //   icon: "/images/icons/comunidad/configuracion.svg",
    //   iconActive: "/images/icons/comunidad/configuracion.svg",
    //   isActive: () => pathname === "/configuracion",
    // },
  ];

  return (
    <>
      {/* Overlay en mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-60 bg-white text-gray-800 shadow-md border-r border-gray-200 z-50 transform transition-transform duration-300 
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Header */}
        <div className="h-17 flex items-center justify-center border-b border-gray-200 relative">
          <Image
            src="/images/logosMulita/logo Mulita-12.svg"
            width={160}
            height={60}
            alt="Logo Mulita"
          />
          <button
            onClick={onClose}
            className="absolute right-3 top-3 md:hidden text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Links */}
        <nav className="flex flex-col gap-1 p-3 text-sm">
          {links.map(({ href, label, icon, iconActive, isActive }) => {
            const active = isActive();
            return (
              <Link
                key={href}
                href={href}
                onClick={handleLinkClick}
                className={`rounded-md px-4 py-3 flex items-center gap-2 transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                <Image
                  src={active ? iconActive : icon}
                  width={20}
                  height={20}
                  alt={label}
                />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
