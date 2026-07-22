import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function MenuAccionesNoticias({
  noticiaId,
  onEliminar,
}: {
  noticiaId: number;
  onEliminar: (id: number) => void;
}) {
  const [open, setOpen] = useState(false); // Estado para controlar si el menú está abierto o cerrado
  const menuRef = useRef<HTMLDivElement | null>(null); // Referencia al contenedor del menú para detectar clicks fuera de él

  // Cerrar si hago click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      {/* Botón 3 puntitos */}
      <button
        onClick={() => setOpen(!open)}
        className="p-1 rounded-full bg-white shadow hover:bg-gray-100"
      >
        ⋮
      </button>

      {/* Menú desplegable */}
      {open && (
        <div className="absolute right-0 mt-2 w-28 bg-white border rounded-md shadow-lg z-20">
          <Link
            href={`/noticias/editar/${noticiaId}`}
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm hover:bg-gray-100 rounded-md"
          >
            Editar
          </Link>
          <button
            onClick={() => onEliminar(noticiaId)}
            className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
          >
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}
