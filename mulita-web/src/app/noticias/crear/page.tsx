"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadFile } from "@/lib/subirArchivos";
import { toast } from "react-hot-toast"

// Definimos la interfaz para el tipo de datos de un archivo subido, que incluye propiedades como URL, nombre y tipo de archivo
interface ArchivoSubido {
  url: string;
  name: string;
  type: string;
}

// Definimos la interfaz para los errores del formulario, que incluye propiedades opcionales para cada campo del formulario
interface ErroresFormulario {
  titulo?: string;
  autor?: string;
  introduccion?: string;
  descripcion?: string;
  imagen_principal?: string;
}

// Definimos la función para la página de creación de noticias, 
// que incluye la funcionalidad para subir una imagen 
// y enviar los datos del formulario a la API
export default function CrearNoticiaPage() {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [introduccion, setIntroduccion] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagen_principal, setImagenPrincipal] = useState<File | null>(null);
  const [errores, setErrores] = useState<ErroresFormulario>({});

  // Función para limpiar nombres de archivo
  function sanitizeFileName(fileName: string) {
    return fileName
      .normalize("NFD") // separa letras y acentos
      .replace(/[\u0300-\u036f]/g, "") // elimina los acentos
      .replace(/[^a-zA-Z0-9.\-_]/g, "_"); // reemplaza cualquier caracter no válido
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nuevosErrores: ErroresFormulario = {};
    if (!titulo.trim()) nuevosErrores.titulo = "El título es obligatorio";
    if (!autor.trim()) nuevosErrores.autor = "El autor es obligatorio";
    if (!introduccion.trim()) nuevosErrores.introduccion = "La introducción es obligatoria";
    if (!descripcion.trim()) nuevosErrores.descripcion = "La descripción es obligatoria";

    // Validación de imagen
    if (!imagen_principal) nuevosErrores.imagen_principal = "La imagen es obligatoria";
    if (imagen_principal instanceof File) { // Si la imagen es un archivo, verificamos que sea una imagen válida
      if (!imagen_principal.type.startsWith("image/")) { // Verificamos que el tipo de archivo sea una imagen
        nuevosErrores.imagen_principal = "El archivo debe ser una imagen válida";
      }
    }

    // Si hay errores, los mostramos y no enviamos el formulario
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    try {
      const archivoSubido: ArchivoSubido[] = []; // Array para almacenar la información del archivo subido

      // Si la imagen principal es un archivo, subimos el archivo y obtenemos la URL
      if (imagen_principal instanceof File) {
        try {
          const sanitizedFileName = sanitizeFileName(imagen_principal.name);
          const filePath = `noticias/imagenes/${Date.now()}_${sanitizedFileName}`;

          // Subir archivo usando la función uploadFile
          const url = await uploadFile(imagen_principal, filePath);

          archivoSubido.push({
            url,
            name: imagen_principal.name,
            type: imagen_principal.type,
          });
        } catch (error) {
          console.error(`Error subiendo ${imagen_principal.name}:`, error);
        }
      }

      const res = await fetch("/api/noticias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          titulo,
          autor,
          introduccion,
          descripcion,
          imagen_principal: archivoSubido?.[0],
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        console.log(error.detail);
        toast.error("Error creando noticia");
        return;
      }

      toast.success("Noticia creada exitosamente");
      router.push("/dashboard/gestionLanding/gestionNoticias");
    } catch (err) {
      console.log("Error en fetch:", err);
      toast.error("Error creando noticia");
    }
  };

  const handleCancel = () => {
    router.push("/dashboard/gestionLanding/gestionNoticias");
  }

  return (
    <div className="w-full bg-white min-h-screen flex flex-col items-center py-12 px-4 text-[#003c71]">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        {/* Encabezado */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-semibold text-black">Crear Nueva Noticia</h1>
          <p className="text-base text-[#003c71]">Introduce los datos</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 bg-white p-6 rounded-lg shadow-md border border-gray-200"
        >
          {/* Título */}
          <div>
            <label className="block text-lg font-semibold mb-2">Título*</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className={`w-full border rounded-md shadow-sm px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none 
                ${errores.titulo ? "border-red-500" : "border-gray-300"}`}
              placeholder="Título"
            />
            {errores.titulo && (
              <p className="text-red-500 text-sm">{errores.titulo}</p>
            )}
          </div>

          {/* Autor */}
          <div>
            <label className="block text-lg font-semibold mb-2">Autor*</label>
            <input
              type="text"
              value={autor}
              onChange={(e) => setAutor(e.target.value)}
              className={`w-full border rounded-md shadow-sm px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none 
                ${errores.autor ? "border-red-500" : "border-gray-300"}`}
              placeholder="Título"
            />
            {errores.autor && (
              <p className="text-red-500 text-sm">{errores.autor}</p>
            )}
          </div>

          {/* Introducción */}
          <div>
            <label className="block text-lg font-semibold mb-2">Introducción*</label>
            <textarea
              value={introduccion}
              onChange={(e) => setIntroduccion(e.target.value)}
              className={`w-full border rounded-md shadow-sm px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none 
                ${errores.introduccion ? "border-red-500" : "border-gray-300"}`}
              placeholder="Título"
            />
            {errores.introduccion && (
              <p className="text-red-500 text-sm">{errores.introduccion}</p>
            )}
          </div>

          {/* Imagen principal */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-lg">Imagen Principal*</label>
            <label className="w-full h-32 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-100 transition">
              <span className="text-gray-500">Sube archivos desde tu dispositivo</span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => setImagenPrincipal(e.target.files?.[0] || null)}
                accept="image/*"
              />
            </label>
            {errores.imagen_principal && (
              <p className="text-red-500 text-sm">{errores.imagen_principal}</p>
            )}
            {imagen_principal && <p className="text-sm text-gray-600 mt-1">Archivo seleccionado: {imagen_principal.name}</p>}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-lg font-semibold mb-2">Descripción*</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className={`w-full border rounded-md shadow-sm px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none 
                ${errores.descripcion ? "border-red-500" : "border-gray-300"}`}
              placeholder="Descripción"
            />
            {errores.descripcion && (
              <p className="text-red-500 text-sm">{errores.descripcion}</p>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex w-full gap-4">
            <button
              type="button"
              onClick={handleCancel}
              className="w-1/2 h-12 bg-gray-300 text-[#003c71] font-semibold rounded-md shadow-md hover:bg-gray-400 transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="w-1/2 h-12 bg-[#003c71] text-white font-semibold rounded-md shadow-md hover:bg-[#00264d] transition"
            >
              Continuar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
