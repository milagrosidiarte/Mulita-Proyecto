"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { uploadFile } from "@/lib/subirArchivos";
import { toast } from "react-hot-toast"

// Definición de interfaces para tipar los datos del producto y errores del formulario
interface TipoProducto {
  id: string;
  nombre: string;
  color: string;
  bgColor: string;
}

// Interfaz para archivos existentes asociados al producto
interface ArchivoExistente {
  archivo_url: string;
  nombre: string;
  eliminado?: boolean;
}

// Interfaz para errores del formulario
interface ErroresFormulario {
  nombre?: string;
  descripcion?: string;
  precio?: string;
  imagenes?: string;
}

// Interfaz para archivos subidos
interface ArchivoSubido {
  url: string;
  name: string;
  type: string;
}

// Tipos de productos disponibles
const TIPOS_PRODUCTOS: TipoProducto[] = [
  { id: "kit", nombre: "Kit", color: "text-blue-800", bgColor: "bg-blue-100" },
  { id: "pieza", nombre: "Pieza", color: "text-green-800", bgColor: "bg-green-100" },
  { id: "capacitacion", nombre: "Capacitación", color: "text-purple-800", bgColor: "bg-purple-100" }
];

// Componente principal de la página de edición de productos
export default function EditarProductoPage() {
  const router = useRouter();
  const params = useParams(); // Obtener parámetros de la URL, como el ID del producto

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");

  const [archivosNuevos, setArchivosNuevos] = useState<File[]>([]);
  const [archivosExistentes, setArchivosExistentes] = useState<ArchivoExistente[]>([]);
  const [tipoSeleccionado, setTipoSeleccionado] = useState("");
  const [loading, setLoading] = useState(true);
  const [errores, setErrores] = useState<ErroresFormulario>({});

  // Cargar datos iniciales
  useEffect(() => {
    const fetchProducto = async () => {
      try {
        const res = await fetch(`/api/productos/${params.id}`, { credentials: "include" });
        const data = await res.json();

        if (!res.ok) {
          console.error("Error:", data.error);
          alert("No se pudo cargar el producto.");
          router.push("/dashboard/gestionLanding/gestionProductos");
          return;
        }

        setNombre(data.nombre);
        setDescripcion(data.descripcion);
        setPrecio(String(data.precio));
        setArchivosExistentes(
          (data.producto_archivos || []).map((a: any) => ({ // Mapear los archivos existentes a la interfaz ArchivoExistente
            archivo_url: a.archivo_url, // URL del archivo
            nombre: a.archivo_url.split("/").pop(), // Extraer el nombre del archivo de la URL
          }))
        );

        // Cargar tipo de producto seleccionado
        if (data.tipo_producto) {
          setTipoSeleccionado(data.tipo_producto);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducto();
  }, [params.id, router]); // Dependencias: params.id y router para recargar si cambian

  // Manejo de archivos
  const handleArchivosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevos = e.target.files ? Array.from(e.target.files) : []; // Convertir FileList a Array
    setArchivosNuevos((prev) => [...prev, ...nuevos]); // Agregar nuevos archivos al estado existente
  };

  // Función para eliminar un archivo nuevo seleccionado
  const handleEliminarArchivoNuevo = (index: number) => {
    setArchivosNuevos((prev) => prev.filter((_, i) => i !== index)); // Eliminar archivo por índice, no necesitamos el nombre del archivo
  };

  // Función para marcar un archivo existente como eliminado
  const handleEliminarArchivoExistente = (nombre: string) => {
    setArchivosExistentes((prev) =>
      prev.map((a) => (a.nombre === nombre ? { ...a, eliminado: true } : a)) // Marcar como eliminado, no eliminar del array para poder enviar la información al backend
    );
  };

  // Función para limpiar nombres de archivo
  function sanitizeFileName(fileName: string) {
    return fileName
      .normalize("NFD") // Normalizar para eliminar acentos
      .replace(/[\u0300-\u036f]/g, "") // Eliminar diacríticos
      .replace(/[^a-zA-Z0-9.\-_]/g, "_"); // Reemplazar caracteres no permitidos por guiones bajos
  }

  // Envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nuevosErrores: ErroresFormulario = {};
    if (!nombre.trim()) nuevosErrores.nombre = "Debes completar el nombre.";
    if (!descripcion.trim()) nuevosErrores.descripcion = "Debes completar la descripción.";
    if (!precio || isNaN(Number(precio)) || Number(precio) <= 0)
      nuevosErrores.precio = "Ingresa un precio válido.";
    if (archivosExistentes.filter((a) => !a.eliminado).length + archivosNuevos.length === 0) {
      nuevosErrores.imagenes = "Debes agregar al menos una imagen.";
    } else if (archivosNuevos.some((img) => !img.type.startsWith("image/"))) {
      nuevosErrores.imagenes = "Todos los archivos deben ser imágenes (JPG, PNG, WEBP, etc.).";
    }
      
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    const urlsExistentes = archivosExistentes // Filtrar los archivos existentes que no han sido eliminados y obtener sus URLs
      .filter((a) => !a.eliminado) 
      .map((a) => a.archivo_url); 

    try { // Subir archivos nuevos y actualizar el producto
      const archivosSubidos: ArchivoSubido[] = []; // Array para almacenar la información de los archivos subidos
      
      for (const archivo of archivosNuevos) { // Iterar sobre cada archivo nuevo seleccionado
        try {
          const sanitizedFileName = sanitizeFileName(archivo.name);
          const filePath = `productos/imagenes/${Date.now()}_${sanitizedFileName}`; // Crear un path único para cada archivo usando timestamp y nombre sanitizado
          
          // Subir archivo usando la función uploadFile
          const url = await uploadFile(archivo, filePath);
          
          archivosSubidos.push({
            url,
            name: archivo.name,
            type: archivo.type,
          });
        } catch (error) {
          console.error(`Error subiendo ${archivo.name}:`, error);
        }
      }
      const res = await fetch(`/api/productos/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre,
          descripcion,
          precio,
          archivosNuevos: archivosSubidos, // Incluir los archivos nuevos subidos
          archivosExistentes: urlsExistentes, // Incluir solo los archivos existentes que no han sido eliminados
          tipo_producto: tipoSeleccionado || null, // Incluir el tipo de producto seleccionado, o null si no hay ninguno
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        console.error("Error response:", error);
        const errorMsg = error.error || error.detail || error.message || "Error al actualizar el producto";
        toast.error(errorMsg);
        return;
      }

      toast.success("Producto actualizado exitosamente")
      router.push("/dashboard/gestionLanding/gestionProductos");
    } catch (err) {
      console.error(err);
      toast.error("Error actualizando el producto");
    }
  };

  const handleCancel = () => router.push("/dashboard/gestionLanding/gestionProductos");

  if (loading)
    return (
      <div className="w-full h-screen flex items-center justify-center text-[#003c71]">
        Cargando producto...
      </div>
    );

  return (
    <div className="w-full bg-white min-h-screen flex flex-col items-center py-12 px-4 text-[#003c71]">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-semibold text-black">Editar Producto</h1>
          <p className="text-base text-[#003c71]">Modifica los datos del producto</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 bg-white p-6 rounded-lg shadow-md border border-gray-200"
        >
          {/* Nombre */}
          <div>
            <label className="block text-lg font-semibold mb-2">Nombre *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={`w-full border rounded-md shadow-sm px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none ${
                errores.nombre ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Nombre del producto"
            />
            {errores.nombre && <p className="text-red-500 text-sm mt-1">{errores.nombre}</p>}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-lg font-semibold mb-2">Descripción *</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className={`w-full border rounded-md shadow-sm px-4 py-2 h-36 resize-none focus:ring-2 focus:ring-blue-400 focus:outline-none ${
                errores.descripcion ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Descripción"
            />
            {errores.descripcion && (
              <p className="text-red-500 text-sm mt-1">{errores.descripcion}</p>
            )}
          </div>

          {/* Precio */}
          <div>
            <label className="block text-lg font-semibold mb-2">Precio *</label>
            <input
              type="number"
              step="0.01"
              value={precio}
              onChange={(e) => {
                let valor = e.target.value;
                // Limitar a 2 decimales
                if (valor && valor.includes('.')) {
                  const partes = valor.split('.');
                  if (partes[1].length > 2) {
                    valor = partes[0] + '.' + partes[1].slice(0, 2);
                  }
                }
                setPrecio(valor);
                if (errores.precio) setErrores({ ...errores, precio: undefined });
              }}
              className={`w-full border rounded-md shadow-sm px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none ${
                errores.precio ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Precio"
            />
            {errores.precio && <p className="text-red-500 text-sm mt-1">{errores.precio}</p>}
          </div>

          {/* Tipo de Producto */}
          <div>
            <label className="block text-lg font-semibold mb-2">Tipo de Producto</label>
            <select
              aria-label="tipo"
              value={tipoSeleccionado}
              onChange={(e) => setTipoSeleccionado(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              <option value="">Seleccionar tipo...</option>
              {TIPOS_PRODUCTOS.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Archivos existentes */}
          {archivosExistentes.some((a) => !a.eliminado) && (
            <div>
              <label className="block text-lg font-semibold mb-2">Imágenes actuales</label>
              <ul className="space-y-1 text-sm">
                {archivosExistentes
                  .filter((a) => !a.eliminado)
                  .map((archivo) => (
                    <li
                      key={archivo.nombre}
                      className="flex justify-between items-center border rounded-md px-3 py-1 bg-gray-50"
                    >
                      <a href={archivo.archivo_url} target="_blank" className="text-blue-600">
                        {archivo.nombre}
                      </a>
                      <button
                        type="button"
                        onClick={() => handleEliminarArchivoExistente(archivo.nombre)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Nuevas imágenes */}
          <div>
            <label className="block text-lg font-semibold mb-2">Agregar nuevas imágenes</label>

            <label className="w-full h-32 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-100">
              <span className="text-gray-500">Sube una o varias imágenes</span>
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleArchivosChange} />
            </label>

            {errores.imagenes && (
              <p className="text-red-500 text-sm mt-2">{errores.imagenes}</p>
            )}

            {archivosNuevos.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm">
                {archivosNuevos.map((archivo, index) => (
                  <li key={index} className="flex justify-between items-center border px-3 py-1 bg-gray-50">
                    {archivo.name}
                    <button
                      type="button"
                      onClick={() => handleEliminarArchivoNuevo(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* BOTONES */}
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
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
