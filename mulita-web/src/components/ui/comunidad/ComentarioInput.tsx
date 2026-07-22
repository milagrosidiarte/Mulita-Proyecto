"use client";

import { useState } from "react";
import toast from "react-hot-toast";

// Componente para ingresar un nuevo comentario en la actividad
export default function ComentarioInput({
  actividadId,
  onNuevoComentario,
}: {
  actividadId: string;
  onNuevoComentario?: () => void;
}) {
  const [contenido, setContenido] = useState(""); // Estado para almacenar el contenido del comentario
  const [cargando, setCargando] = useState(false);

  // Función para enviar el comentario al backend
  const handleEnviar = async () => {
    if (!contenido.trim()) return; // No enviar comentarios vacíos
    setCargando(true);
    try {
      const res = await fetch("/api/comunidad/comentarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contenido,
          actividad_id: actividadId,
        }),
      });
      if (res.ok) {
        toast.success("Comentario enviado");
        setContenido(""); // Limpiamos el input después de enviar
        onNuevoComentario?.(); // Llamamos al callback para notificar al componente padre que hay un nuevo comentario
      } else {
        toast.error("Error al agregar comentario");
      }
    } catch (err) {
      console.error("Error en el envío:", err);
      toast.error("Error al enviar comentario");
    } finally {
      setCargando(false);
    }
  };

  // Función para manejar la tecla Enter y enviar el comentario
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnviar(); // Llamamos a la función de envío cuando se presiona Enter sin Shift
    }
  };

  return (
    <div className="flex items-center gap-2 mt-2">
      <input
        type="text"
        placeholder="Escribe un comentario..."
        value={contenido}
        onChange={(e) => setContenido(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 appearance-none border-2 border-[#003c71] rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-0 bg-white"
        disabled={cargando}
      />
      <button
        onClick={handleEnviar}
        disabled={cargando}
        className="px-4 py-2 border-2 border-[#003c71] text-[#003c71] rounded-full text-sm font-semibold hover:bg-blue-50 disabled:opacity-50 transition"
      >
        {cargando ? "Enviando..." : "Enviar"}
      </button>
    </div>
  );
}
