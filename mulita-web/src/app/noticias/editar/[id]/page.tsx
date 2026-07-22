"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast"
import { uploadFile } from "@/lib/subirArchivos";

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

// Componente principal de la página de edición de noticias
export default function EditarNoticiaPage() {
  const params = useParams(); // Obtenemos los parámetros de la URL, incluyendo el ID de la noticia a editar
  const router = useRouter();

  const [titulo, setTitulo] = useState("");
  const [autor, setAutor] = useState("");
  const [introduccion, setIntroduccion] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagen_principal, setImagenPrincipal] = useState<File | string | null>(null); // Puede ser un archivo (File) o una URL (string)
  const [loading, setLoading] = useState(true); 
  const [submitting, setSubmitting] = useState(false);
  const [errores, setErrores] = useState<ErroresFormulario>({});

  // Cargar noticia existente
  useEffect(() => {
    const fetchNoticia = async () => {
      try {
        const res = await fetch(`/api/noticias/${params.id}`);
        if (!res.ok) throw new Error("Noticia no encontrada");
        const data = await res.json();

        setTitulo(data.titulo);
        setAutor(data.autor);
        setIntroduccion(data.introduccion);
        setDescripcion(data.descripcion);
        setImagenPrincipal(data.imagen_principal);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNoticia();
  }, [params.id]); // Dependencia de params.id para recargar si cambia el ID

  // Función para sanitizar el nombre del archivo, eliminando caracteres especiales y reemplazándolos por guiones bajos
  function sanitizeFileName(fileName: string) {
    return fileName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.\-_]/g, "_");
  }

  // Función para manejar el envío del formulario
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Validación de campos del formulario
    const nuevosErrores: ErroresFormulario = {};
    if (!titulo.trim()) nuevosErrores.titulo = "El título es obligatorio";
    if (!autor.trim()) nuevosErrores.autor = "El autor es obligatorio";
    if (!introduccion.trim()) nuevosErrores.introduccion = "La introducción es obligatoria";
    if (!descripcion.trim()) nuevosErrores.descripcion = "La descripción es obligatoria";

    // Validación de imagen
    if (imagen_principal instanceof File) {
      if (!imagen_principal.type.startsWith("image/")) {
        nuevosErrores.imagen_principal = "El archivo debe ser una imagen válida";
      }
    }

    // Actualizamos el estado de errores y detenemos la ejecución si hay errores
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    try {
      const archivoSubido: ArchivoSubido[] = []; // Array para almacenar información sobre los archivos subidos
            
      // Si la imagen principal es un archivo (File), procedemos a subirla
      if (imagen_principal instanceof File) {
        try {
          const sanitizedFileName = sanitizeFileName(imagen_principal.name);
          const filePath = `productos/imagenes/${Date.now()}_${sanitizedFileName}`;
          
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

      // Determinar la nueva URL de la imagen principal
      const nuevaUrlImagen =
      archivoSubido.length > 0
        ? archivoSubido[0].url // Si se subió un archivo, usamos la URL del primer archivo subido
        : typeof imagen_principal === "string" // Si imagen_principal es una cadena (URL), la usamos directamente
        ? imagen_principal 
        : null; // Si no hay imagen, establecemos como null

      // Enviar la solicitud PATCH para actualizar la noticia en el backend
      const res = await fetch(`/api/noticias/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          titulo,
          autor,
          introduccion,
          descripcion,
          imagen_principal: nuevaUrlImagen,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        toast.error("Error actualizando noticia")
        throw new Error("Error actualizando noticia");
      }

      toast.success("Noticia actualizada exitosamente")
      router.push(`/dashboard/gestionLanding/gestionNoticias`);
    } catch (err) {
      console.error(err);
      toast.error("Error actualizando noticia")
    } finally {
      setSubmitting(false);
    }
  };

  // Función para manejar la cancelación de la edición, redirigiendo al usuario a la página de gestión de noticias
  const handleCancel = () => {
    router.push("/dashboard/gestionLanding/gestionNoticias");
  }


  if (loading) return <p className="text-center mt-10">Cargando noticia...</p>;

  return (
    <div className="w-full bg-white min-h-screen flex flex-col items-center py-12 px-4 text-[#003c71]">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-semibold text-black">Editar Noticia</h1>
          <p className="text-base text-[#003c71]">Modifica los datos</p>
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
          <div>
            <label className="block text-lg font-semibold mb-2">Imagen Principal*</label>
            {typeof imagen_principal === "string" && (
              <img src={imagen_principal} alt="Imagen actual" className="w-full h-48 object-cover rounded" />
            )}
            <input
              type="file"
              placeholder="Imagen Principal"
              onChange={(e) => setImagenPrincipal(e.target.files?.[0] || null)}
              className={`w-full border rounded-md px-4 py-2 cursor-pointer text-gray-600
                ${errores.imagen_principal ? "border-red-500" : "border-gray-300"}`}
              accept="image/*"
            />
            {errores.imagen_principal && (
              <p className="text-red-500 text-sm">{errores.imagen_principal}</p>
            )}
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
              disabled={submitting}
              className="w-1/2 h-12 bg-[#003c71] text-white font-semibold rounded-md shadow-md hover:bg-[#00264d] transition"
            >
              {submitting ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
