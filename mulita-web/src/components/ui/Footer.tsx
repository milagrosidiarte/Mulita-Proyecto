"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@/hooks/queries";

export function Footer() {
  const pathname = usePathname(); 
  const { user } = useUser();

  // si la ruta actual coincide con alguna de esas secciones, 
// el footer no se renderiza (return null)
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/noticias/crear") ||
    pathname.startsWith("/noticias/editar") ||
    pathname.startsWith("/comunidad") ||
    pathname.startsWith("/perfil") ||
    pathname.startsWith("/colecciones") ||
    pathname.startsWith("/productos") ||
    pathname.startsWith("/tienda/carrito") ||
    pathname.startsWith("/auth")
  ) {
    return null;
  }

  return (
    <footer className="mt-24 bg-primary text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 grid md:grid-cols-4 gap-10">
        
        <div>
          <h3 className="text-lg font-bold tracking-tight">MULITA</h3>
          <p className="mt-3 text-white/80 text-sm">
            Un lugar para aprender, compartir y construir. Sé parte de la comunidad.
          </p>
          <Link
            href={user ? "/comunidad" : "/auth/register"}
            className="btn btn--yellow mt-4"
          >
            ¡Únete!
          </Link>
        </div>

      
        <div className="flex flex-col items-start justify-start gap-6">
          <div className="relative leading-[22px] font-semibold">Enlaces</div>
          <div className="flex flex-col items-start justify-start gap-4 text-[#b4b9c9]">
            <Link href="/" className="cursor-pointer">Inicio</Link>
            <Link href="/noticias" className="cursor-pointer">Noticias</Link>
            <Link href="/comunidad" className="cursor-pointer">Comunidad</Link>
            <Link href="/tienda" className="cursor-pointer">Tienda</Link>
          </div>
        </div>
        
        <div className="flex flex-col items-start justify-start gap-6">
          <div className="relative leading-[22px] font-semibold">Sobre nosotros</div>
          <div className="flex flex-col items-start justify-start gap-4 text-[#b4b9c9]">
            <Link href="/sobreNosotros#quienes-somos" className="cursor-pointer">¿Quiénes somos?</Link>
            <Link href="/sobreNosotros#mision-vision" className="cursor-pointer">Misión</Link>
            <Link href="/sobreNosotros#mision-vision" className="cursor-pointer">Visión</Link>
            <Link href="/sobreNosotros#donde-estamos" className="cursor-pointer">¿Dónde estamos?</Link>
          </div>
        </div>
         
        <div className="flex flex-col items-start justify-start gap-6">
          <div className="relative leading-[22px] font-semibold">Contacto</div>
          <div className="flex flex-col items-start justify-start gap-4 text-[#b4b9c9]">
            <div>Universidad Adventista del Plata</div>
            <div>Libertador San Martin, Entre Rios</div>
            <div>contacto@uap.edu.ar</div>
            <div>+54 9 3435 723461</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
