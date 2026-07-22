"use client";

import Image from "next/image";
import Link from "next/link";

export default function GestionLandingPage() {
  return (
    <div className="w-full max-w-[1103px] mx-auto relative overflow-hidden flex flex-col items-center px-4 sm:px-6 pb-10 box-border text-center text-xs text-[#6d758f] font-inter">
      {/* Headings */}
      <div className="w-full flex flex-col items-start text-[28px] sm:text-[32px] md:text-[36px]">
        <h1 className="leading-tight font-extrabold text-black">
          Gestión de Landing
        </h1>
        <p className="mt-2 text-left text-sm sm:text-base leading-6 text-[#6d758f]">
          Gestión de las diferentes secciones de la página
        </p>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-4 sm:gap-6 w-full mt-8">
        {cards.map(({ href, title, desc }) => (
          <Link
            key={href}
            href={href}
            className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 bg-white border border-[#e1e4ed] rounded-lg shadow-sm hover:shadow-md transition text-left"
          >
            <div className="flex flex-col items-start">
              <h2 className="text-base sm:text-lg font-semibold text-black">
                {title}
              </h2>
              <p className="text-sm text-[#6d758f] mt-1">{desc}</p>
            </div>
            <div className="mt-3 sm:mt-0 self-end sm:self-auto">
              <Image
                src="/images/icons/dashboard/gestionLanding/flecha.svg"
                alt={`Ir a ${title}`}
                width={20}
                height={20}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Definimos un array de objetos que representan las tarjetas de gestión de las diferentes secciones de la página "Landing"
const cards = [
  {
    href: "/dashboard/gestionLanding/gestionInicio",
    title: "Gestión Inicio",
    desc: "Configura la página principal",
  },
  {
    href: "/dashboard/gestionLanding/gestionNoticias",
    title: "Gestión Noticias",
    desc: "Administra las noticias publicadas",
  },
  {
    href: "/dashboard/gestionLanding/gestionCategorias",
    title: "Gestión Categorías",
    desc: "Organiza categorías de productos o noticias",
  },
  {
    href: "/dashboard/gestionLanding/gestionProductos",
    title: "Gestión Productos",
    desc: "Controla y edita los productos",
  },
  {
    href: "/dashboard/gestionLanding/gestionSobreNosotros",
    title: "Gestión Sobre Nosotros",
    desc: "Edita la información de la empresa",
  },
];
