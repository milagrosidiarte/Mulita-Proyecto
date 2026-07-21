"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/hooks/queries";
import { useRouter } from "next/navigation";

// Componente para el menú de acciones en el encabezado principal
export default function MenuAccionesHeaderPrincipal() {
  const { user, logout } = useUser(); // se obtiene el usuario actual y la función de cierre de sesión del hook useUser
  const router = useRouter();
  const [open, setOpen] = useState(false); // estado para controlar si el menú está abierto o cerrado
  const menuRef = useRef<HTMLDivElement>(null); // referencia al contenedor del menú para detectar clics fuera de él

  // Cerrar menú al hacer click afuera 
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) { // si el clic no es dentro del menú, se cierra el menú
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside); // se agrega un listener para detectar clics fuera del menú
    return () => document.removeEventListener("mousedown", handleClickOutside); // se limpia el listener al desmontar el componente
  }, []);

  if (!user) return null; // si no hay usuario, no se renderiza nada

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="relative flex items-center justify-center w-10 h-10 rounded-full overflow-hidden hover:opacity-90 transition"
      >
        <img
          src={user.imagen || "/images/icons/perfil/default-avatar.svg"}
          alt="Avatar"
          className={`w-full h-full object-cover ${!user.imagen ? "scale-50" : ""}`}
        />
        <span className="absolute right-[-4px] bottom-[-2px] i-lucide-chevron-down text-gray-600 bg-white rounded-full p-[2px] shadow-sm" />
      </button>


      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg py-2 z-50">
          <Link
            href={`/perfil/${user.id}`}
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm hover:bg-muted"
          >
            Perfil
          </Link>
          {/* <Link
            href="/configuracion"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm hover:bg-muted"
          >
            Configuración
          </Link> */}
          <button
            type="button"
            onClick={() => {
              logout({
                onSuccess: () => {
                  setOpen(false);
                },
                onError: (error) => {
                  console.error("Error al cerrar sesión:", error);
                },
              });
            }}
            className="block w-full text-left px-4 py-2 text-sm hover:bg-muted"
          >
            Salir
          </button>
        </div>
      )}
    </div>
  );
}
