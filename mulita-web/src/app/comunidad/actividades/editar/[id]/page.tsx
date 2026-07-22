"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { uploadFile } from "@/lib/subirArchivos";
import SkeletonEditarActividad from "@/components/ui/comunidad/skeletons/SkeletonEditarActividad";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "react-hot-toast";

interface Categoria {
  id: string;
  nombre: string;
  tipo?: "curso" | "dificultad" | "materia";
}

interface ArchivoExistente {
  archivo_url: string;
  nombre: string;
  tipo: string;
  eliminado?: boolean;
}

interface ArchivoSubido {
  url: string;
  name: string;
  type: string;
}

interface ErroresFormulario {
  titulo?: string;
  descripcion?: string;
  categorias?: string;
  archivo?: string;
}

export default function EditarActividadPage() {
  const router = useRouter();
  const params = useParams();

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [archivosNuevos, setArchivosNuevos] = useState<File[]>([]);
  const [archivosExistentes, setArchivosExistentes] = useState<ArchivoExistente[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const MAX_FILE_SIZE = 30 * 1024 * 1024;

  // Cargar datos iniciales
  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const res = await fetch(`/api/comunidad/actividades/${params.id}`, {
          credentials: "include",
        });
        const data = await res.json();

        if (!res.ok) {
          console.error("Error al obtener la actividad", data.error);
          toast.error("No se pudo cargar la actividad.");
          router.push("/comunidad");
          return;
        }

        setTitulo(data.titulo);
        setDescripcion(data.descripcion);
        setArchivosExistentes(data.actividad_archivos || []);
        setCategoriasSeleccionadas(data.categorias_ids);

        const { data: categoriasData, error: categoriasError } = await supabase
          .from("categoria")
          .select("id, nombre, tipo");

        if (!categoriasError && categoriasData) setCategorias(categoriasData);
      } catch (err) {
        console.error("Error al cargar datos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDatos();
  }, [params.id, router]);

  // Manejo de categorías
  const handleCategoriaChange = (id: string) => {
    setCategoriasSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  // Manejo de archivos
  const handleArchivosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevos = e.target.files ? Array.from(e.target.files) : [];
    setArchivosNuevos((prev) => [...prev, ...nuevos]);
  };

  // Función para eliminar un archivo nuevo de la lista
  const handleEliminarArchivoNuevo = (index: number) => {
    setArchivosNuevos((prev) => prev.filter((_, i) => i !== index));
  };

  // Función para marcar un archivo existente como eliminado
  const handleEliminarArchivoExistente = (nombre: string) => {
    setArchivosExistentes((prev) =>
      prev.map((a) =>
        a.nombre === nombre ? { ...a, eliminado: true } : a
      )
    );
  };

  // Función para limpiar el nombre del archivo y evitar problemas con caracteres especiales
  function sanitizeFileName(fileName: string) {
    return fileName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9.\-_]/g, "_");
  }

  // Envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nuevosErrores: ErroresFormulario = {};
    if (!titulo.trim()) nuevosErrores.titulo = "Debes completar el título.";
    if (!descripcion.trim()) nuevosErrores.descripcion = "Debes completar la descripción.";
    if (categoriasSeleccionadas.length === 0)
      nuevosErrores.categorias = "Debes seleccionar al menos una categoría.";

    // Validación de tamaño de archivos nuevos
    const archivoGrande = archivosNuevos.find((archivo) => archivo.size > MAX_FILE_SIZE);
    if (archivoGrande) {
      nuevosErrores.archivo = `El archivo "${archivoGrande.name}" supera el límite de 30 MB.`;
    }

     if (Object.keys(nuevosErrores).length > 0) {
        setErrores(nuevosErrores);
        if (nuevosErrores.archivo) toast.error(nuevosErrores.archivo);
        return;
      }

    // Filtramos los archivos que el usuario decidió mantener
    const urlsExistentes = archivosExistentes
      .filter((a) => !a.eliminado)
      .map((a) => a.archivo_url);
    
    try {
      const archivosSubidos: ArchivoSubido[] = [];

      for (const archivo of archivosNuevos) {
        try {
          const sanitizedFileName = sanitizeFileName(archivo.name);
          const filePath = `comunidad/actividades/${Date.now()}_${sanitizedFileName}`;
          
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

      // Enviar todos los datos en una sola llamada
      const res = await fetch(`/api/comunidad/actividades/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          titulo,
          descripcion,
          categorias: categoriasSeleccionadas,
          archivosNuevos: archivosSubidos,
          archivosExistentes: urlsExistentes,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        console.error(error.detail || error.message);
        toast.error("Error actualizando actividad");
        return;
      }

      toast.success("Actividad actualizada exitosamente");
      // Guardar la actividad actualizada en sessionStorage para que se actualice en la vista
      sessionStorage.setItem("actividadActualizada", JSON.stringify({
        id: params.id,
        titulo,
        descripcion,
      }));
      router.push("/comunidad");
    } catch (err) {
      console.error("Error en fetch:", err);
      toast.error("Error actualizando actividad");
    }
  };

  const handleCancel = () => router.push("/comunidad");

  const handleEliminar = async () => {
    try {
      const res = await fetch(`/api/comunidad/actividades/${params.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Error eliminando la actividad");

      toast.success("Actividad eliminada correctamente");
      setShowConfirmDelete(false);
      router.push("/comunidad");
    } catch (err: any) {
      console.error(err);
      toast.error("No se pudo eliminar la actividad");
    }
  };

  if (loading)
    return <SkeletonEditarActividad />;

  return (
    <div className="w-full bg-white min-h-screen flex flex-col items-center py-12 px-4 text-[#003c71]">
      <ConfirmDialog
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title="Eliminar actividad"
        message="¿Estás seguro de que deseas eliminar esta actividad? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        isDangerous={true}
        onConfirm={handleEliminar}
      />
      <div className="w-full max-w-3xl flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-semibold text-black">Editar Actividad</h1>
          <p className="text-base text-[#003c71]">Modifica los datos de la actividad</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 bg-white p-6 rounded-lg shadow-md border border-gray-200"
        >
          {/* Título */}
          <div>
            <label className="block text-lg font-semibold mb-2">Título *</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => {
                setTitulo(e.target.value);
                if (errores.titulo) setErrores({ ...errores, titulo: undefined });
              }}
              className={`w-full border rounded-md shadow-sm px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none ${
                errores.titulo ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Título"
            />
            {errores.titulo && <p className="text-red-500 text-sm mt-1">{errores.titulo}</p>}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-lg font-semibold mb-2">Descripción *</label>
            <textarea
              value={descripcion}
              onChange={(e) => {
                setDescripcion(e.target.value);
                if (errores.descripcion) setErrores({ ...errores, descripcion: undefined });
              }}
              className={`w-full border rounded-md shadow-sm px-4 py-2 h-36 resize-none focus:ring-2 focus:ring-blue-400 focus:outline-none ${
                errores.descripcion ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Descripción"
            />
            {errores.descripcion && (
              <p className="text-red-500 text-sm mt-1">{errores.descripcion}</p>
            )}
          </div>

          {/* Categorías */}
          <div>
            <label className="block text-lg font-semibold mb-2">Categorías *</label>
            <div className="flex flex-col gap-6">
              {/* Cursos */}
              {categorias.filter((c) => c.tipo === "curso").length > 0 && (
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="text-base font-semibold text-blue-700 mb-2">Cursos</h3>
                  <div className="flex flex-wrap gap-2">
                    {categorias
                      .filter((c) => c.tipo === "curso")
                      .map((cat) => (
                        <label
                          key={cat.id}
                          className={`flex items-center gap-2 border px-3 py-2 rounded-md cursor-pointer transition ${
                            categoriasSeleccionadas.includes(cat.id)
                              ? "bg-blue-100 border-blue-500"
                              : "bg-gray-50 hover:bg-gray-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={categoriasSeleccionadas.includes(cat.id)}
                            onChange={() => {
                              handleCategoriaChange(cat.id);
                              if (errores.categorias)
                                setErrores({ ...errores, categorias: undefined });
                            }}
                            className="accent-blue-600"
                          />
                          {cat.nombre}
                        </label>
                      ))}
                  </div>
                </div>
              )}

              {/* Materias */}
              {categorias.filter((c) => c.tipo === "materia").length > 0 && (
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="text-base font-semibold text-green-700 mb-2">Materias</h3>
                  <div className="flex flex-wrap gap-2">
                    {categorias
                      .filter((c) => c.tipo === "materia")
                      .map((cat) => (
                        <label
                          key={cat.id}
                          className={`flex items-center gap-2 border px-3 py-2 rounded-md cursor-pointer transition ${
                            categoriasSeleccionadas.includes(cat.id)
                              ? "bg-green-100 border-green-500"
                              : "bg-gray-50 hover:bg-gray-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={categoriasSeleccionadas.includes(cat.id)}
                            onChange={() => {
                              handleCategoriaChange(cat.id);
                              if (errores.categorias)
                                setErrores({ ...errores, categorias: undefined });
                            }}
                            className="accent-green-600"
                          />
                          {cat.nombre}
                        </label>
                      ))}
                  </div>
                </div>
              )}

              {/* Dificultades */}
              {categorias.filter((c) => c.tipo === "dificultad").length > 0 && (
                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="text-base font-semibold text-orange-700 mb-2">Dificultades</h3>
                  <div className="flex flex-wrap gap-2">
                    {categorias
                      .filter((c) => c.tipo === "dificultad")
                      .map((cat) => (
                        <label
                          key={cat.id}
                          className={`flex items-center gap-2 border px-3 py-2 rounded-md cursor-pointer transition ${
                            categoriasSeleccionadas.includes(cat.id)
                              ? "bg-orange-100 border-orange-500"
                              : "bg-gray-50 hover:bg-gray-100"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={categoriasSeleccionadas.includes(cat.id)}
                            onChange={() => {
                              handleCategoriaChange(cat.id);
                              if (errores.categorias)
                                setErrores({ ...errores, categorias: undefined });
                            }}
                            className="accent-orange-600"
                          />
                          {cat.nombre}
                        </label>
                      ))}
                  </div>
                </div>
              )}
            </div>
            {errores.categorias && (
              <p className="text-red-500 text-sm mt-1">{errores.categorias}</p>
            )}
          </div>

          {/* Archivos existentes */}
          {archivosExistentes.some((a) => !a.eliminado) && (
            <div>
              <label className="block text-lg font-semibold mb-2">Archivos actuales</label>
              <ul className="space-y-1 text-sm">
                {archivosExistentes
                  .filter((a) => !a.eliminado)
                  .map((archivo) => (
                    <li
                      key={archivo.nombre}
                      className="flex justify-between items-center border rounded-md px-3 py-1 bg-gray-50"
                    >
                      <a
                        href={archivo.archivo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate text-blue-600 hover:underline"
                      >
                        {archivo.nombre}
                      </a>
                      <button
                        type="button"
                        onClick={() => handleEliminarArchivoExistente(archivo.nombre)}
                        className="text-red-500 hover:text-red-700 text-sm font-semibold"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Subir nuevos archivos */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-lg">Agregar nuevos archivos</label>
            <label className="w-full h-32 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-100 transition">
              <span className="text-gray-500">Sube uno o varios archivos</span>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleArchivosChange}
              />
            </label>

            {archivosNuevos.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm">
                {archivosNuevos.map((archivo, index) => (
                  <li
                    key={index}
                    className="flex justify-between items-center border rounded-md px-3 py-1 bg-gray-50"
                  >
                    <span className="truncate">{archivo.name}</span>
                    <button
                      type="button"
                      onClick={() => handleEliminarArchivoNuevo(index)}
                      className="text-red-500 hover:text-red-700 text-sm font-semibold"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Botones */}
          <div className="flex w-full gap-4">
            <button
              type="button"
              onClick={handleCancel}
              className="w-1/3 h-12 bg-gray-300 text-[#003c71] font-semibold rounded-md shadow-md hover:bg-gray-400 transition"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              className="w-1/3 h-12 bg-red-500 text-white font-semibold rounded-md shadow-md hover:bg-red-600 transition"
            >
              Eliminar
            </button>

            <button
              type="submit"
              className="w-1/3 h-12 bg-[#003c71] text-white font-semibold rounded-md shadow-md hover:bg-[#00264d] transition"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
