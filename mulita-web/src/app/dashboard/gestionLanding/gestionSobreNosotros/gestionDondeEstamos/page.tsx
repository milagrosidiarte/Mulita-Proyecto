"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Definimos la función para la página de gestión de "Dónde Estamos", que incluye la funcionalidad para editar el título y contenido de la sección
export default function GestionMisionVisionPage() { 
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  // Obtener datos actuales
  useEffect(() => {
    const fetchDondeEstamos = async () => {
      try {
        const res = await fetch("/api/sobreNosotros/dondeEstamos");
        if (!res.ok) throw new Error("No se pudo obtener la información");
        const data = await res.json();

        setTitulo(data.titulo); // Cargar título
        setContenido(data.contenido ?? ""); // Cargar descripción
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDondeEstamos();
  }, []);

  // Función para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("titulo", titulo); // Agregamos el título al FormData
      formData.append("contenido", contenido); // Agregamos el contenido al FormData

      const res = await fetch("/api/sobreNosotros/dondeEstamos", {
        method: "PATCH",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Error al actualizar el contenido");

      router.push("/dashboard/gestionLanding/gestionSobreNosotros"); // Redirigimos a la página de gestión de "Sobre Nosotros" después de guardar los cambios
    } catch (err) {
      console.error(err);
      alert("Error al actualizar Donde Estamos");
    } finally {
      setSubmitting(false);
    }
  };

  // Función para manejar la cancelación del formulario, redirigiendo a la página de gestión de "Sobre Nosotros"
  const handleCancel = () =>
    router.push("/dashboard/gestionLanding/gestionSobreNosotros");

  if (loading) return <p className="text-center mt-10">Cargando datos...</p>;

  return (
    <div className="w-full bg-white min-h-screen flex flex-col items-center py-12 px-4 text-[#003c71]">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        <h1 className="text-2xl font-semibold text-black text-center">
          Gestión - ¿Dónde Estamos?
        </h1>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 bg-white p-6 rounded-lg shadow-md border border-gray-200"
        >
          {/* TÍTULO */}
          <div>
            <label className="block text-lg font-semibold mb-2">Título</label>
            <input
              aria-label="Título"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              required
            />
          </div>

          {/* DESCRIPCIÓN (textarea) */}
          <div>
            <label className="block text-lg font-semibold mb-2">
              Descripción
            </label>
            <textarea
              ref={textAreaRef}
              aria-label="Descripción"
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Tab") { // Si se presiona la tecla Tab, insertamos un bullet point en lugar de cambiar el foco
                  e.preventDefault();

                  const textarea = textAreaRef.current; // Obtenemos la referencia al textarea
                  if (!textarea) return; // Si no hay referencia, salimos de la función

                  const start = textarea.selectionStart; // Guardamos la posición del cursor antes de insertar el bullet
                  const end = textarea.selectionEnd; // Guardamos la posición del cursor antes de insertar el bullet

                  // Insertar bullet point
                  const bullet = "• ";

                  const updatedText =
                    contenido.substring(0, start) + bullet + contenido.substring(end); // Creamos el nuevo contenido con el bullet insertado

                  setContenido(updatedText);

                  // Mover cursor después del bullet
                  requestAnimationFrame(() => {
                    if (textAreaRef.current) {
                      const pos = start + bullet.length;
                      textAreaRef.current.selectionStart = pos;
                      textAreaRef.current.selectionEnd = pos;
                    }
                  });
                }
              }}

              className="w-full border border-gray-300 rounded-md px-4 py-2 h-32 resize-none focus:ring-2 focus:ring-blue-400 focus:outline-none"
              placeholder="Escriba una descripción..."
              required
            />

          </div>

          {/* Botones */}
          <div className="flex w-full gap-4 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="w-1/2 h-12 bg-gray-300 text-[#003c71] font-semibold rounded-md shadow-md hover:bg-gray-400 transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="w-1/2 h-12 bg-[#003c71] text-white font-semibold rounded-md shadow-md hover:bg-[#00264d] transition"
            >
              {submitting ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
