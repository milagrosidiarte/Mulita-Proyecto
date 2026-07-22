"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { uploadFile } from "@/lib/subirArchivos"; 
import { toast } from "react-hot-toast";
import Select from "react-select";

// TIPOS

type TipoDocumento = "link" | "archivo" | "imagen";

// Interfaz para la documentación individual que maneja la edición en el frontend.
interface Documento {
  tipo: TipoDocumento;
  link: string | null;
  archivo: File | string | null;
  imagen: File | string | null;
  descripcion: string; 
  nombre: string | null;
}

interface ErroresDocumento {
  link?: string;
  archivo?: string;
  imagen?: string;
  descripcion?: string;
}

// Opciones para el selector de tipo de documento
const opcionesTipo = [
  { value: "link", label: "Link" },
  { value: "archivo", label: "Archivo" },
  { value: "imagen", label: "Imagen" },
];

// COMPONENTE PRINCIPAL

export default function GestionDocumentacion() {
  const router = useRouter();

  const [titulo, setTitulo] = useState(""); // Título principal de la sección de documentación
  const [descripcion, setDescripcion] = useState(""); // Descripción principal de la sección de documentación
  const [documentos, setDocumentos] = useState<Documento[]>([]); // Lista de documentos que se mostrarán y editarán en el frontend
  const [erroresDocs, setErroresDocs] = useState<ErroresDocumento[]>([]); // Lista de errores específicos para cada documento, útil para validación y retroalimentación al usuario
  const [erroresGenerales, setErroresGenerales] = useState<{ titulo?: string; descripcion?: string }>({}); // Errores generales para el título y la descripción principal, útil para validación y retroalimentación al usuario
  const [loading, setLoading] = useState(true); // Indica si los datos de la documentación se están cargando desde el backend, útil para mostrar un indicador de carga al usuario
  const [submitting, setSubmitting] = useState(false); // Indica si el formulario se está enviando al backend, útil para deshabilitar botones y mostrar un indicador de progreso al usuario

  // CARGA DE DATOS
  useEffect(() => {
    const fetchDocumentacion = async () => {
      try {
        const res = await fetch("/api/inicio/documentacion");
        if (!res.ok) throw new Error("No se pudo obtener la documentación");

        const data = await res.json();

        setTitulo(data.titulo || ""); // Si el backend no devuelve un título, se establece como cadena vacía
        setDescripcion(data.descripcion || ""); // Lo mismo con la descripcion 

        // Mapeo de datos: Convertir la única 'url' del backend a los campos separados del frontend
        setDocumentos(
          data.documentos?.map((doc: any) => ({ // Mapeo de cada documento recibido del backend a la estructura que el frontend espera
            tipo: doc.tipo, // El tipo de documento
            // Mapeamos doc.url a los campos separados del frontend
            link: doc.tipo === "link" ? doc.url : null, // Si el tipo es "link", usamos la url o null si no lo es
            archivo: doc.tipo === "archivo" ? doc.url : null, 
            imagen: doc.tipo === "imagen" ? doc.url : null,
            
            descripcion: doc.descripcion ?? "", // Si el backend no devuelve una descripción, se establece como cadena vacía
            nombre: doc.nombre ?? null, // Si el backend no devuelve un nombre, se establece como null
          })) || [] // Si no hay documentos, se establece como un array vacío
        );

        setErroresDocs((data.documentos || []).map(() => ({}))); // Inicializamos los errores de cada documento como un objeto vacío, uno por cada documento recibido del backend
      } catch (err) {
        console.error("Error al cargar la documentación:", err);
        toast.error("Error al cargar la documentación");
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentacion();
  }, []);

  // VALIDACIÓN DE FORMULARIO
  const validarFormulario = () => {
    let valido = true;

    const nuevosErroresGenerales: { titulo?: string; descripcion?: string } = {}; // Inicializamos un objeto para almacenar errores generales del formulario, como el título y la descripción principal
    const nuevosErroresDocs: ErroresDocumento[] = documentos.map(() => ({})); // Inicializamos un array de objetos para almacenar errores específicos de cada documento, uno por cada documento en el estado

    // Validar título
    if (!titulo.trim()) {
      nuevosErroresGenerales.titulo = "El título es obligatorio.";
      valido = false;
    }

    // Validar descripción principal
    if (!descripcion.trim()) {
      nuevosErroresGenerales.descripcion = "La descripción es obligatoria.";
      valido = false;
    }

    // Validación de documentos
    documentos.forEach((doc, i) => {
      const errores: ErroresDocumento = {}; // Inicializamos un objeto para almacenar errores específicos del documento actual

      // Validación por tipo
      if (doc.tipo === "link") {
        if (!doc.link || !doc.link.trim()) {
          errores.link = "El link es obligatorio.";
          valido = false;
        } else if (!/^https?:\/\//.test(doc.link)) {
          errores.link = "Debe ser un enlace válido (http o https).";
          valido = false;
        }
      }

      if (doc.tipo === "archivo") {
        if (!doc.archivo) {
          errores.archivo = "Debes subir un archivo.";
          valido = false;
        }
      }

      if (doc.tipo === "imagen") {
        if (!doc.imagen) {
          errores.imagen = "Debes subir una imagen.";
          valido = false;
        }
      }

      nuevosErroresDocs[i] = errores; // Asignamos los errores encontrados para el documento actual al array de errores de documentos
    });

    setErroresGenerales(nuevosErroresGenerales);
    setErroresDocs(nuevosErroresDocs);

    return valido;
  };


  // UTILIDADES
  const sanitizeFileName = (fileName: string) => // Limpiar el nombre del archivo como eliminar acentos y caracteres especiales, reemplazándolos por guiones bajos
    fileName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.\-_]/g, "_");

  // MANEJO DE CAMBIOS
  const handleDocChange = (index: number, field: keyof Documento, value: any) => { 
    const nuevosDocs = [...documentos]; // Creamos una copia del estado de documentos para no mutar directamente el estado
    const nuevosErrores = [...erroresDocs]; // Creamos una copia del estado de errores de documentos para no mutar directamente el estado
    // Resetear errores del documento
    nuevosErrores[index] = {};

    let nuevoNombre = nuevosDocs[index].nombre; // Inicializamos el nuevo nombre con el valor actual del documento, para mantenerlo si no se cambia el archivo o imagen
    
    // Si se cambia el link, archivo o imagen, actualizamos el nombre si es un archivo
    if (field === 'archivo' || field === 'imagen') {
        if (value instanceof File) {
            nuevoNombre = value.name;
        } else if (value === null) {
            // Si se borra el archivo, borramos el nombre
            nuevoNombre = null; 
        }
    }
    
    // Si se cambia el tipo, limpiamos los campos de URL irrelevantes
    if (field === 'tipo') {
        if (value === 'link') {
            nuevosDocs[index].archivo = null; // Si el tipo es link, limpiamos archivo e imagen
            nuevosDocs[index].imagen = null;
        } else if (value === 'archivo') {
            nuevosDocs[index].link = null;
            nuevosDocs[index].imagen = null;
        } else if (value === 'imagen') {
            nuevosDocs[index].link = null;
            nuevosDocs[index].archivo = null;
        }
        nuevosDocs[index].nombre = null; // Reiniciamos el nombre al cambiar el tipo
    }
    
    // Actualizamos el documento en la posición correspondiente con los nuevos valores y el nombre actualizado
    nuevosDocs[index] = { ...nuevosDocs[index], [field]: value, nombre: nuevoNombre };
    setDocumentos(nuevosDocs); // Actualizamos el estado de documentos con la copia modificada
    setErroresDocs(nuevosErrores);
  };

  // Agregar y eliminar documentos
  const agregarDocumento = () => {
    setDocumentos([
      ...documentos, // Mantenemos los documentos existentes
      { 
        tipo: "link", 
        link: "",
        archivo: null,
        imagen: null,
        descripcion: "",
        nombre: null,
      }
    ]);
    setErroresDocs([...erroresDocs, {}]); // Agregamos un objeto vacío para los errores del nuevo documento
  };

  // Eliminar documento por índice, actualizando tanto la lista de documentos como la lista de errores correspondiente
  const eliminarDocumento = (index: number) => {
    setDocumentos(documentos.filter((_, i) => i !== index)); // Filtramos el documento a eliminar y actualizamos el estado de documentos 
    // _ significa que no necesitamos el valor del documento, solo su índice, 
    // i !== index significa que mantenemos todos los documentos excepto el que queremos eliminar
    setErroresDocs(erroresDocs.filter((_, i) => i !== index));
  }; 
  
  // MANEJO DE SUBMIT (PATCH)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Ejecutar validación
    if (!validarFormulario()) {
      setSubmitting(false);
      toast.error("Revisa los errores en el formulario.");
      return;
    }

    try {
      // Definimos el tipo de datos que el backend espera
      interface DocumentoParaBackend {
        tipo: TipoDocumento;
        url: string;
        descripcion: string;
        nombre: string | null;
      }
      
      // Creamos un array para almacenar los documentos finales que se enviarán al backend, 
      // transformando los datos del frontend a la estructura que el backend espera
      const documentosFinales: DocumentoParaBackend[] = [];

      for (let i = 0; i < documentos.length; i++) { // Iteramos sobre cada documento para procesarlo y transformarlo a la estructura que el backend espera
        const doc = documentos[i]; // Obtenemos el documento actual
        let finalUrl = ""; // Inicializamos la URL final que se enviará al backend
        let finalNombre = doc.nombre; // Inicializamos el nombre final que se enviará al backend, que puede ser null si no se ha subido un archivo o imagen

        // Consolidar la URL y subir archivos si es necesario
        if (doc.tipo === "link" && doc.link) {
            finalUrl = doc.link;
        } else if (doc.tipo === "archivo") {
            if (doc.archivo instanceof File) {
                const sanitized = sanitizeFileName(doc.archivo.name);
                finalUrl = await uploadFile(doc.archivo, `documentacion/archivos/${Date.now()}_${sanitized}`);
                finalNombre = doc.archivo.name;
            } else if (typeof doc.archivo === "string") {
                finalUrl = doc.archivo; // Es una URL existente
            }
        } else if (doc.tipo === "imagen") {
            if (doc.imagen instanceof File) {
                const sanitized = sanitizeFileName(doc.imagen.name);
                finalUrl = await uploadFile(doc.imagen, `documentacion/imagenes/${Date.now()}_${sanitized}`);
                finalNombre = doc.imagen.name;
            } else if (typeof doc.imagen === "string") {
                finalUrl = doc.imagen; // Es una URL existente
            }
        }
        
        // El backend espera 'url', 'descripcion' y 'nombre'
        documentosFinales.push({
          tipo: doc.tipo,
          url: finalUrl, // URL consolidada final
          descripcion: doc.descripcion,
          nombre: finalNombre,
        });
      }

      // Envío de datos
      const res = await fetch("/api/inicio/documentacion", {
        method: "PATCH", // actualizamos la documentación existente
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo,
          descripcion,
          documentos: documentosFinales,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error actualizando documentación");
      }

      toast.success("Documentación actualizada correctamente");
      router.push("/dashboard/gestionLanding/gestionInicio");
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar");
    } finally {
      setSubmitting(false);
    }
  };


  if (loading) return <p className="text-center mt-10">Cargando documentación...</p>;

  return (
    <div className="w-full min-h-screen flex flex-col items-center py-12 px-4 bg-gray-50">
      <div className="w-full max-w-4xl flex flex-col gap-6">
        <h1 className="text-2xl font-semibold text-black text-center">Gestión - Documentación</h1>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 bg-white p-6 rounded-xl shadow-lg border border-gray-200"
        >
          {/* Título y Descripción Principal */}
          <div>
            <label className="block font-semibold mb-2 text-[#003c71]">
              Título
            </label>
            <input 
              aria-label="titulo"
              type="text" 
              value={titulo} 
              onChange={(e) => setTitulo(e.target.value)} 
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none focus:border-gray-300" 
            />
            {erroresGenerales.titulo && (
              <p className="text-red-500 text-sm">{erroresGenerales.titulo}</p>
            )}
          </div>
          <div>
            <label className="block font-semibold mb-2 text-[#003c71]">
              Descripción Principal
            </label>
            <textarea 
              aria-label="descripcion"
              value={descripcion} 
              onChange={(e) => setDescripcion(e.target.value)} 
              className="w-full border rounded-lg px-4 py-2 h-32 resize-none focus:ring-2 focus:ring-blue-400 focus:outline-none focus:border-gray-300" 
            />
            {erroresGenerales.descripcion && (
              <p className="text-red-500 text-sm">{erroresGenerales.descripcion}</p>
            )}
          </div>

          {/* Documentos */}
          <div>
            <h2 className="text-xl font-semibold text-[#003c71] mb-4">Documentos</h2>

            <div className="flex flex-col gap-6">
              {documentos.map((doc, index) => (
                <div key={index} className="p-5 border border-gray-300 rounded-xl shadow-sm bg-gray-50 relative">
                  
                  {/* Botón eliminar */}
                  <button type="button" onClick={() => eliminarDocumento(index)} className="absolute top-0 right-2 text-red-500 text-4xl font-bold leading-none hover:text-red-800 transition">
                    ×
                  </button>

                  {/* Selector de Tipo */}
                  <div className="mb-4">
                    <label className="block font-semibold mb-2 text-[#003c71]">
                      Tipo de documento
                    </label>
                    <Select 
                      options={opcionesTipo} 
                      value={opcionesTipo.find((o) => o.value === doc.tipo)} 
                      onChange={(opcion) => handleDocChange(index, "tipo", opcion?.value as TipoDocumento)} 
                      className="text-black" 
                    />
                  </div>

                  {/* Input Dinámico (Link) */}
                  {doc.tipo === "link" && (
                    <div className="mb-4">
                        <label className="block font-semibold mb-2 text-[#003c71]">
                          URL
                        </label>
                        <input 
                          type="text" 
                          placeholder="Ingrese URL del link" 
                          value={doc.link || ""} onChange={(e) => handleDocChange(index, "link", e.target.value)} 
                          className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none focus:border-gray-300" 
                        />
                        {erroresDocs[index]?.link && <p className="text-red-500 text-sm">{erroresDocs[index].link}</p>}
                    </div>
                  )}

                  {/* Input Dinámico (Archivo / Imagen) */}
                  {(doc.tipo === "archivo" || doc.tipo === "imagen") && (
                    <div className="mb-4">
                      <label className="block font-semibold mb-2 text-[#003c71]">
                        {doc.tipo === 'archivo' ? 'Archivo' : 'Imagen'}
                      </label>
                      
                      {/* Mostrar archivo actual */}
                      {doc.tipo === 'archivo' && doc.archivo && typeof doc.archivo === 'string' && <p className="text-sm mb-2">Archivo actual: **{doc.nombre}**</p>}

                      {/* Mostrar imagen actual o preview */}
                      {doc.tipo === 'imagen' && (doc.imagen && typeof doc.imagen === 'string') && (
                          <div className="w-full h-40 rounded-lg overflow-hidden mb-3"><img alt="imagen actual" src={doc.imagen} className="w-full h-full object-cover" /></div>
                      )}
                      {doc.tipo === 'imagen' && doc.imagen instanceof File && (
                          <div className="w-full h-40 rounded-lg overflow-hidden mb-3"><img alt="nueva imagen" src={URL.createObjectURL(doc.imagen)} className="w-full h-full object-cover" /></div>
                      )}
                      
                      {/* Input de archivo */}
                      <input 
                        aria-label="imagen/archivo"
                        type="file" 
                        accept={doc.tipo === "imagen" ? "image/*" : undefined} 
                        onChange={(e) => handleDocChange(index, doc.tipo as "archivo" | "imagen", e.target.files?.[0] || null)} 
                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none focus:border-gray-300" 
                      />
                      {doc.archivo instanceof File || doc.imagen instanceof File ? <p className="text-sm mt-1 text-green-600">Nuevo archivo seleccionado</p> : null}
                      {doc.tipo === "archivo" && erroresDocs[index]?.archivo && (
                        <p className="text-red-500 text-sm mt-1">
                          {erroresDocs[index]?.archivo}
                        </p>
                      )}
                      {doc.tipo === "imagen" && erroresDocs[index]?.imagen && (
                        <p className="text-red-500 text-sm mt-1">
                          {erroresDocs[index]?.imagen}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Descripción del Ítem */}
                  <div className="mt-4">
                    <label className="block font-semibold mb-2 text-[#003c71]">
                      Descripción del Ítem (Opcional)
                    </label>
                    <input 
                      type="text" 
                      placeholder="Ingrese una descripción" 
                      value={doc.descripcion || ""} onChange={(e) => handleDocChange(index, "descripcion", e.target.value)} 
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none focus:border-gray-300"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button type="button" onClick={agregarDocumento} className="w-full mt-4 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-semibold">
              + Agregar documento
            </button>
          </div>

          <div className="flex w-full gap-4">
            <button
              type="button"
              onClick={() => router.push("/dashboard/gestionLanding/gestionInicio")}
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