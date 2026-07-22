"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SkeletonMisionVision from "@/components/ui/dashboard/skeletons/SkeletonMisionVision";
import { uploadFile } from "@/lib/subirArchivos";
import toast from "react-hot-toast"

// Definimos la función para la página de gestión de "Misión y Visión", que incluye la funcionalidad 
// para editar los títulos, descripciones e imágenes de la sección
export default function GestionMisionVisionPage() {
  const router = useRouter();

  const [titulo1, setTitulo1] = useState("");
  const [titulo2, setTitulo2] = useState("");
  const [descripcion1, setDescripcion1] = useState("");
  const [descripcion2, setDescripcion2] = useState("");
  const [imagen1, setImagen1] = useState<File | string | null>(null);
  const [imagen2, setImagen2] = useState<File | string | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Obtener datos actuales
  useEffect(() => {
    const fetchMisionVision = async () => {
      try {
        const res = await fetch("/api/sobreNosotros/misionVision");
        if (!res.ok) throw new Error("No se pudo obtener la información");
        const data = await res.json();

        setTitulo1(data.titulo1);
        setTitulo2(data.titulo2);
        setDescripcion1(data.descripcion1);
        setDescripcion2(data.descripcion2);
        setImagen1(data.imagen1);
        setImagen2(data.imagen2);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMisionVision();
  }, []);

  function sanitizeFileName(fileName: string) {
    return fileName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.\-_]/g, "_");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      let nuevaUrlImagen1: string | null = typeof imagen1 === "string" ? imagen1 : null; // Si la imagen es un string (URL), la mantenemos; si es un archivo, la subiremos
      let nuevaUrlImagen2: string | null = typeof imagen2 === "string" ? imagen2 : null; 
      
      // Subir imagen1 si es un archivo
      if (imagen1 instanceof File) {
        try {
          const sanitizedFileName = sanitizeFileName(imagen1.name);
          const filePath = `sobreNosotros/mision-vision/${Date.now()}_${sanitizedFileName}`;
          
          // Subir archivo usando la función uploadFile
          const url = await uploadFile(imagen1, filePath);
          
          nuevaUrlImagen1 = url;
        } catch (error) {
          console.error(`Error subiendo ${imagen1.name}:`, error);
        }
      }

      if (imagen2 instanceof File) {
        try {
          const sanitizedFileName = sanitizeFileName(imagen2.name);
          const filePath = `sobreNosotros/mision-vision/${Date.now()}_${sanitizedFileName}`;
          
          // Subir archivo usando la función uploadFile
          const url = await uploadFile(imagen2, filePath);
          
          nuevaUrlImagen2 = url;
        } catch (error) {
          console.error(`Error subiendo ${imagen2.name}:`, error);
        }
      }

      // Enviar los datos actualizados a la API
      const res = await fetch("/api/sobreNosotros/misionVision", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          titulo1,
          titulo2,
          descripcion1,
          descripcion2,
          imagen1: nuevaUrlImagen1,
          imagen2: nuevaUrlImagen2,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        toast.error("Error actualizando Misión y Visión")
        throw new Error("Error actualizando misión visión");
      }

      toast.success("Misión y Visión actualizadas exitosamente")
      router.push("/dashboard/gestionLanding/gestionSobreNosotros");
    } catch (err) {
      console.error(err);
      toast.error("Error actualizando Misión y Visión")
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => router.push("/dashboard/gestionLanding/gestionSobreNosotros");

  if (loading) return <SkeletonMisionVision />;

  return (
    <div className="w-full bg-white min-h-screen flex flex-col items-center py-12 px-4 text-[#003c71]">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        <h1 className="text-2xl font-semibold text-black text-center">Gestión Misión y Visión</h1>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 bg-white p-6 rounded-lg shadow-md border border-gray-200"
        >
          {/* Bloque 1 */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Bloque 1</h2>

            <label className="block text-lg font-semibold mb-2">Título</label>
            <input
              aria-label="titulo1"
              type="text"
              value={titulo1}
              onChange={(e) => setTitulo1(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-4 py-2"
              required
            />

            <label className="block text-lg font-semibold mt-4 mb-2">Descripción</label>
            <textarea
              aria-label="descripcion1"
              value={descripcion1}
              onChange={(e) => setDescripcion1(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-4 py-2 h-24 resize-none"
              required
            />

            <label className="block text-lg font-semibold mt-4 mb-2">Imagen</label>
            {typeof imagen1 === "string" && (
              <img src={imagen1} alt="Imagen 1 actual" className="w-full h-48 object-cover rounded mb-2" />
            )}
            <input
              type="file"
              placeholder="Imagen 1"
              onChange={(e) => setImagen1(e.target.files?.[0] || null)}
              className="w-full border border-gray-300 rounded-md px-4 py-2 cursor-pointer text-gray-600"
              accept="image/*"
            />
          </div>

          {/* Bloque 2 */}
          <div className="border-t border-gray-300 pt-6">
            <h2 className="text-xl font-semibold mb-4">Bloque Equipo 2</h2>

            <label className="block text-lg font-semibold mb-2">Título</label>
            <input
              aria-label="titulo2"
              type="text"
              value={titulo2}
              onChange={(e) => setTitulo2(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-4 py-2"
              required
            />

            <label className="block text-lg font-semibold mt-4 mb-2">Descripción</label>
            <textarea
              aria-label="descripcion2"
              value={descripcion2}
              onChange={(e) => setDescripcion2(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-4 py-2 h-24 resize-none"
              required
            />

            <label className="block text-lg font-semibold mt-4 mb-2">Imagen</label>
            {typeof imagen2 === "string" && (
              <img src={imagen2} alt="Imagen 2 actual" className="w-full h-48 object-cover rounded mb-2" />
            )}
            <input
              type="file"
              placeholder="Imagen 2"
              onChange={(e) => setImagen2(e.target.files?.[0] || null)}
              className="w-full border border-gray-300 rounded-md px-4 py-2 cursor-pointer text-gray-600"
              accept="image/*"
            />
          </div>

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
