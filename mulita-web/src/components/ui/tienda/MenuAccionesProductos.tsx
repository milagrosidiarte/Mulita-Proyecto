import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function MenuAccionesProductos({
  productoId, // ID del producto para las acciones
  onEliminar, // Función que se llama cuando se hace click en eliminar
}: {
  productoId: number; 
  onEliminar: (id: number) => void; // recibe un ID y no devuelve nada
}) {
  const [open, setOpen] = useState(false); // si el menu esta visible o no
  const menuRef = useRef<HTMLDivElement | null>(null); // referencia para el div contenedor del menu

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
            href={`/productos/editar/${productoId}`}
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm hover:bg-gray-100 rounded-md"
          >
            Editar
          </Link>
          <button
            onClick={() => onEliminar(productoId)}
            className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
          >
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}
