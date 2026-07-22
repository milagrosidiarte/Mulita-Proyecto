"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SkeletonHero from "@/components/ui/dashboard/skeletons/SkeletonHero";
import { uploadFile } from "@/lib/subirArchivos";
import toast from "react-hot-toast"

// Definimos la interfaz para el archivo subido, que incluye la URL del archivo, su nombre y tipo
interface ArchivoSubido {
  url: string;
  name: string;
  type: string;
}

// Definimos la función para el hero, que incluye el título, descripción e imagen
export default function GestionHeroPage() {
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagen, setImagen] = useState<File | string | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Cargar hero existente
    useEffect(() => {
      const fetchHero = async () => {
        try {
          const res = await fetch("/api/inicio/hero"); 
          if (!res.ok) throw new Error("Hero no encontrado");
          const data = await res.json();
  
          setTitulo(data.titulo);
          setDescripcion(data.descripcion);
          setImagen(data.imagen);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
  
      fetchHero();
    }, []);

  function sanitizeFileName(fileName: string) {
    return fileName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.\-_]/g, "_");
  }

  // Manejo de submit (PATCH) para actualizar el hero
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const archivoSubido: ArchivoSubido[] = []; // Array para almacenar los archivos subidos y sus URLs

      if (imagen instanceof File) { // Si la imagen es un archivo, subimos el archivo y obtenemos la URL
        try {
          const sanitizedFileName = sanitizeFileName(imagen.name);
          const filePath = `inicio/hero/${Date.now()}_${sanitizedFileName}`;
          
          // Subir archivo usando la función uploadFile
          const url = await uploadFile(imagen, filePath);
          
          archivoSubido.push({ // Agregamos la URL del archivo subido al array
            url,
            name: imagen.name,
            type: imagen.type,
          });
        } catch (error) {
          console.error(`Error subiendo ${imagen.name}:`, error);
        }
      }

      // Determinar la URL de la imagen a enviar al backend: si se subió un archivo, usamos su URL; si no, usamos la URL existente; si no hay ninguna, enviamos null
      const nuevaUrlImagen =
      archivoSubido.length > 0
        ? archivoSubido[0].url
        : typeof imagen === "string"
        ? imagen
        : null;

      const res = await fetch("/api/inicio/hero", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          titulo,
          descripcion,
          imagen: nuevaUrlImagen,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        toast.error("Error actualizando hero")
        throw new Error("Error actualizando el hero");
      }

      toast.success("Hero actualizado exitosamente")
      router.push("/dashboard/gestionLanding/gestionInicio");
    } catch (err) {
      console.log("Error en fetch:", err);
      toast.error("Error actualizando hero")
    } finally {
      setSubmitting(false);
    }
  };

  // Manejo de cancelación, redirigiendo al usuario a la página de gestión de inicio
  const handleCancel = () => router.push("/dashboard/gestionLanding/gestionInicio");

  if (loading) return <SkeletonHero />;

  return (
    <div className="w-full bg-white min-h-screen flex flex-col items-center py-12 px-4 text-[#003c71]">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        <h1 className="text-2xl font-semibold text-black text-center">Gestión Hero</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div>
            <label className="block text-lg font-semibold mb-2">Título</label>
            <input
              aria-label="titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-lg font-semibold mb-2">Descripción</label>
            <textarea
              aria-label="descripcion"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-4 py-2 h-32 resize-none focus:ring-2 focus:ring-blue-400 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-lg font-semibold mb-2">Imagen Principal</label>
            {typeof imagen === "string" && (
              <img src={imagen} alt="Imagen actual" className="w-full h-48 object-cover rounded" />
            )}
            <input
              type="file"
              placeholder="Imagen Principal"
              onChange={(e) => setImagen(e.target.files?.[0] || null)}
              className="w-full border border-gray-300 rounded-md px-4 py-2 cursor-pointer text-gray-600"
              accept="image/*"
            />
          </div>

          <div className="flex w-full gap-4">
            <button type="button" onClick={handleCancel} className="w-1/2 h-12 bg-gray-300 text-[#003c71] font-semibold rounded-md shadow-md hover:bg-gray-400 transition">
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
