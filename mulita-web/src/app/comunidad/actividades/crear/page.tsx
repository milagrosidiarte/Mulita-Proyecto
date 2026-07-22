"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { uploadFile } from "@/lib/subirArchivos";
import { toast } from "react-hot-toast";

// Tipos de datos
interface Categoria {
  id: string;
  nombre: string;
  tipo?: "curso" | "dificultad" | "materia";
}

// Tipos de errores del formulario
interface ErroresFormulario {
  titulo?: string; 
  descripcion?: string;
  categorias?: string;
  archivo?: string;
}

// Tipos de archivos subidos
interface ArchivoSubido {
  url: string;
  name: string;
  type: string;
}

// Componente de creación de actividad
export default function CrearActividadPage() {
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [archivos, setArchivos] = useState<File[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);
  const [errores, setErrores] = useState<ErroresFormulario>({});

  const MAX_FILE_SIZE = 30 * 1024 * 1024; // 30 MB

  // Cargar categorías desde Supabase
  useEffect(() => {
    const fetchCategorias = async () => {
      const { data, error } = await supabase.from("categoria").select("id, nombre, tipo");
      if (!error && data) setCategorias(data); 
      setCargandoCategorias(false);
    };
    fetchCategorias();
  }, []);

  // Manejo de selección de categorías
  const handleCategoriaChange = (id: string) => {
    const categoriaPulsada = categorias.find((c) => c.id === id); // Encontrar la categoría pulsada
    if (!categoriaPulsada) return;

    setCategoriasSeleccionadas((prev) => {
      // Si ya está seleccionada, deseleccionar
      if (prev.includes(id)) {
        return prev.filter((c) => c !== id);
      }

      // Si no está seleccionada, buscar si ya hay una del mismo tipo
      const categoriasDelMismoTipo = prev.filter(
        (cId) => categorias.find((c) => c.id === cId)?.tipo === categoriaPulsada.tipo // Filtrar las categorías seleccionadas que sean del mismo tipo que la pulsada
      );

      // Si ya hay una del mismo tipo, reemplazarla; si no, agregar
      if (categoriasDelMismoTipo.length > 0) {
        // Reemplazar la anterior por la nueva
        return prev 
          .filter((cId) => categorias.find((c) => c.id === cId)?.tipo !== categoriaPulsada.tipo) // Filtrar las categorías seleccionadas que no sean del mismo tipo
          .concat(id); // Agregar la nueva categoría
      }

      // Si no hay ninguna del mismo tipo, agregar
      return [...prev, id]; // Agregar la nueva categoría
    });
  };

  // Manejo de cambio de archivos
  const handleArchivosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nuevosArchivos = e.target.files ? Array.from(e.target.files) : []; // Convertir FileList a Array
    setArchivos((prev) => [...prev, ...nuevosArchivos]); // Agregar los nuevos archivos a los existentes
  };

  // Manejo de eliminación de archivos
  const handleEliminarArchivo = (index: number) => {
    setArchivos((prev) => prev.filter((_, i) => i !== index));
  };

  // Función para limpiar nombres de archivo
  function sanitizeFileName(fileName: string) {
    return fileName
      .normalize("NFD") // separa letras y acentos
      .replace(/[\u0300-\u036f]/g, "") // elimina los acentos
      .replace(/[^a-zA-Z0-9.\-_]/g, "_"); // reemplaza cualquier caracter no válido
  }

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nuevosErrores: ErroresFormulario = {};
    if (!titulo.trim()) nuevosErrores.titulo = "Debes completar el título.";
    if (!descripcion.trim()) nuevosErrores.descripcion = "Debes completar la descripción.";
    if (categoriasSeleccionadas.length === 0)
      nuevosErrores.categorias = "Debes seleccionar al menos una categoría.";

    // Validar tamaño de archivos
    const archivoGrande = archivos.find((archivo) => archivo.size > MAX_FILE_SIZE);
    if (archivoGrande) {
      nuevosErrores.archivo = `El archivo "${archivoGrande.name}" supera el límite de 30 MB.`;
    }

    // Si hay errores, actualizar el estado y mostrar mensajes
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      if (nuevosErrores.archivo) toast.error(nuevosErrores.archivo); // Mostrar error de archivo si existe
      return;
    }

    try {
      // Subir archivos directamente a Supabase primero
      const archivosSubidos: ArchivoSubido[] = [];
      
      for (const archivo of archivos) { // Iterar sobre cada archivo seleccionado
        try {
          const sanitizedFileName = sanitizeFileName(archivo.name); // Limpiar el nombre del archivo para evitar problemas con caracteres especiales
          const filePath = `comunidad/actividades/${Date.now()}_${sanitizedFileName}`; // Crear un path único para cada archivo usando timestamp y nombre limpio
          
          // Subir archivo usando la función uploadFile en src/lib/subirArchivos.ts
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
      
      // Enviar todos los datos en una sola llamada porque ya tenemos las URLs de los archivos subidos
      const res = await fetch("/api/comunidad/actividades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          titulo,
          descripcion,
          categorias: categoriasSeleccionadas,
          archivos: archivosSubidos,
        }),
        credentials: "include", // Incluir cookies para autenticación
      });

      if (!res.ok) {
        const error = await res.json();
        console.error(error.detail || error.message);
        toast.error("Error creando actividad");
        return;
      }

      toast.success("Actividad creada exitosamente");
      router.push("/comunidad");
    } catch (err) {
      console.error("Error en fetch:", err);
      toast.error("Error creando actividad");
    }
  };

  // Manejo de cancelación
  const handleCancel = () => router.push("/comunidad"); // Redirigir a la página de comunidad al cancelar

  return (
    <div className="w-full bg-white min-h-screen flex flex-col items-center py-12 px-4 text-[#003c71]">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        {/* Encabezado */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-semibold text-black">Crear Nueva Actividad</h1>
          <p className="text-base text-[#003c71]">Introduce los datos</p>
        </div>

        {/* Formulario */}
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
                setTitulo(e.target.value); // Actualizar el estado del título
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
            {cargandoCategorias ? (
              <p className="text-gray-500">Cargando categorías...</p>
            ) : categorias.length === 0 ? (
              <p className="text-gray-500">No hay categorías disponibles.</p>
            ) : (
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
            )}
            {errores.categorias && (
              <p className="text-red-500 text-sm mt-1">{errores.categorias}</p>
            )}
          </div>

          {/* Archivos */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-lg">Archivos (opcional)</label>

            <label className="w-full h-32 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-100 transition">
              <span className="text-gray-500">Sube uno o varios archivos</span>
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleArchivosChange}
              />
            </label>

            {archivos.length > 0 && (
              <div>
                {/* Vista previa de archivos */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {archivos.map((archivo, index) => (
                    <div key={index} className="relative group">
                      {/* Mostrar preview si es imagen */}
                      {archivo.type.startsWith("image/") ? (
                        <img
                          src={URL.createObjectURL(archivo)}
                          alt={archivo.name}
                          className="w-24 h-24 object-cover rounded-md border border-gray-300"
                          title={archivo.name}
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gray-200 rounded-md border border-gray-300 flex items-center justify-center text-xs text-center p-2">
                          {archivo.name.split(".").pop()?.toUpperCase()}
                        </div>
                      )}
                      {/* Botón eliminar */}
                      <button
                        type="button"
                        onClick={() => handleEliminarArchivo(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-sm font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Lista completa de archivos */}
                <ul className="mt-3 space-y-1 text-sm border-t pt-2">
                  {archivos.map((archivo, index) => (
                    <li
                      key={index}
                      className="flex justify-between items-center border rounded-md px-3 py-2 bg-gray-50 hover:bg-gray-100 transition"
                    >
                      <span className="truncate text-xs">{archivo.name}</span>
                      <button
                        type="button"
                        onClick={() => handleEliminarArchivo(index)}
                        className="text-red-500 hover:text-red-700 text-lg font-semibold ml-2"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Botones */}
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
