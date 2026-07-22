"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { uploadFile } from "@/lib/subirArchivos";

// Definición de la interfaz ArchivoSubido para tipar los datos del archivo subido
interface ArchivoSubido {
  url: string;
  name: string;
  type: string;
}

// Componente principal de la página de edición de perfil
export default function EditarPerfilPage() {
  const params = useParams(); // Obtener parámetros de la URL, como el ID del perfil
  const router = useRouter();
  const queryClient = useQueryClient(); // Instancia de QueryClient para invalidar queries y refrescar datos

  const [biografia, setBiografia] = useState("");
  const [imagen, setImagen] = useState<File | string | null>(null);
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [passwordConfirmar, setPasswordConfirmar] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [erroresForm, setErroresForm] = useState<Record<string, string>>({});

   // Función para limpiar nombres de archivo
  function sanitizeFileName(fileName: string) {
    return fileName
      .normalize("NFD") // separa letras y acentos
      .replace(/[\u0300-\u036f]/g, "") // elimina los acentos
      .replace(/[^a-zA-Z0-9.\-_]/g, "_"); // reemplaza cualquier caracter no válido
  }

  // Cargar perfil existente
  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const res = await fetch(`/api/perfil/${params.id}`);
        if (!res.ok) throw new Error("Perfil no encontrado");
        const data = await res.json();

        setBiografia(data.perfil.biografia || ""); // Si no hay biografía, se establece como cadena vacía
        setImagen(data.perfil.imagen || null); // Si no hay imagen, se establece como null
        setNombre(data.perfil.usuario.nombre || "");
        setApellido(data.perfil.usuario.apellido || "");
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPerfil();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpiar errores anteriores
    setErroresForm({});
    const nuevosErrores: Record<string, string> = {};

    // Validaciones
    if (!nombre.trim()) {
      nuevosErrores.nombre = "El nombre es requerido";
    }
    if (!apellido.trim()) {
      nuevosErrores.apellido = "El apellido es requerido";
    }

    // Validar contraseña si está intentando cambiarla
    if (passwordNueva || passwordActual) {
      if (!passwordActual) {
        nuevosErrores.passwordActual = "Debes ingresar tu contraseña actual";
      }
      if (!passwordNueva) {
        nuevosErrores.passwordNueva = "Debes ingresar una contraseña nueva";
      }
      if (passwordNueva && passwordNueva.length < 6) {
        nuevosErrores.passwordNueva = "La contraseña debe tener al menos 6 caracteres";
      }
      if (passwordNueva && passwordConfirmar && passwordNueva !== passwordConfirmar) {
        nuevosErrores.passwordConfirmar = "Las contraseñas no coinciden";
      }
    }

    // Si hay errores, mostrarlos
    if (Object.keys(nuevosErrores).length > 0) {
      setErroresForm(nuevosErrores);
      toast.error("Por favor corrige los errores en el formulario");
      return;
    }

    // Si no hay errores, proceder a enviar los datos
    setSubmitting(true);

    // Manejo de la subida de imagen y actualización del perfil
    try { // el try porque la subida de archivos puede fallar
      const archivoSubido: ArchivoSubido[] = [] // Array para almacenar la información del archivo subido

      if (imagen instanceof File) { // Si la imagen es un archivo, subirla
        try {
          const sanitizedFileName = sanitizeFileName(imagen.name);
          const filePath = `perfiles/${params.id}/${Date.now()}_${sanitizedFileName}`;

          // Subir archivo usando la función uploadFile
          const url = await uploadFile(imagen, filePath);

          archivoSubido.push({
            url,
            name: imagen.name,
            type: imagen.type,
          });
        } catch (error) {
          console.error(`Error subiendo ${imagen.name}:`, error);
        }
      }

      // Determinar la URL de la imagen a enviar en la solicitud PATCH
      const nuevaUrlImagen = 
      archivoSubido.length > 0 // Si hay archivos subidos, usar la URL del primero
        ? archivoSubido[0].url // Usar la URL del archivo subido
        : typeof imagen === "string" // Si la imagen es una cadena (URL existente), usarla
        ? imagen 
        : null; // Si no hay imagen, enviar null

      const res = await fetch(`/api/perfil/${params.id}`, { // Enviar solicitud PATCH para actualizar el perfil
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          biografia,
          nombre,
          apellido,
          passwordActual,
          passwordNueva,
          imagen: nuevaUrlImagen,
        }),
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) {
        // Mostrar mensaje de error específico
        if (data.error.includes("Contraseña actual incorrecta")) {
          setErroresForm({ passwordActual: "La contraseña actual es incorrecta" });
          toast.error("La contraseña actual es incorrecta");
        } else if (data.error.includes("contraseña")) {
          toast.error(data.error);
        } else {
          toast.error(data.error || "Error actualizando el perfil");
        }
        return;
      }

      toast.success("Perfil actualizado exitosamente");
      
      // Refrescar datos del usuario en todas partes
      await queryClient.invalidateQueries({ queryKey: ["user"] }); 
      
      // Si cambió la contraseña, redirigir a login
      if (passwordNueva) {
        toast.success("Contraseña actualizada. Por favor inicia sesión nuevamente");
        setTimeout(() => {
          router.push("/auth/login");
        }, 1500);
      } else {
        router.push(`/perfil/${params.id}`);
      }
    } catch (err) {
      console.error("Error en fetch:", err);
      toast.error(err instanceof Error ? err.message : "Error actualizando el perfil");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => router.push(`/perfil/${params.id}`);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        Cargando perfil...
      </div>
    );

  return (
    <div className="w-full bg-white min-h-screen flex flex-col items-center py-12 px-4 text-[#003c71]">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            title="Volver"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-semibold text-black">Editar Perfil</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-6 bg-white p-6 rounded-lg shadow-md border border-gray-200"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-lg font-semibold mb-2">Nombre</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={`w-full border rounded-md px-4 py-2 focus:ring-2 focus:outline-none ${
                  erroresForm.nombre ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-blue-400"
                }`}
                placeholder="Tu nombre"
              />
              {erroresForm.nombre && <p className="text-red-500 text-sm mt-1">{erroresForm.nombre}</p>}
            </div>
            <div>
              <label className="block text-lg font-semibold mb-2">Apellido</label>
              <input
                type="text"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                className={`w-full border rounded-md px-4 py-2 focus:ring-2 focus:outline-none ${
                  erroresForm.apellido ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-blue-400"
                }`}
                placeholder="Tu apellido"
              />
              {erroresForm.apellido && <p className="text-red-500 text-sm mt-1">{erroresForm.apellido}</p>}
            </div>
          </div>

          <div>
            <label className="block text-lg font-semibold mb-2">Biografía</label>
            <textarea
              value={biografia}
              onChange={(e) => setBiografia(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-4 py-2 h-32 resize-none focus:ring-2 focus:ring-blue-400 focus:outline-none"
              placeholder="Contanos algo sobre vos..."
            />
          </div>

          <div>
            <label className="block text-lg font-semibold mb-2">Imagen de perfil</label>
            {typeof imagen === "string" && imagen && (
              <img
                src={imagen}
                alt="Imagen actual"
                className="w-full h-48 object-cover rounded mb-3"
              />
            )}
            <input
              type="file"
              placeholder="Imagen de Perfil"
              onChange={(e) => setImagen(e.target.files?.[0] || null)}
              className="w-full border border-gray-300 rounded-md px-4 py-2 cursor-pointer text-gray-600"
              accept="image/*"
            />
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Cambiar contraseña (opcional)</h3>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-base font-semibold mb-2">Contraseña actual</label>
                <input
                  type="password"
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                  className={`w-full border rounded-md px-4 py-2 focus:ring-2 focus:outline-none ${
                    erroresForm.passwordActual ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-blue-400"
                  }`}
                  placeholder="Tu contraseña actual"
                />
                {erroresForm.passwordActual && <p className="text-red-500 text-sm mt-1">{erroresForm.passwordActual}</p>}
              </div>
              <div>
                <label className="block text-base font-semibold mb-2">Contraseña nueva</label>
                <input
                  type="password"
                  value={passwordNueva}
                  onChange={(e) => setPasswordNueva(e.target.value)}
                  className={`w-full border rounded-md px-4 py-2 focus:ring-2 focus:outline-none ${
                    erroresForm.passwordNueva ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-blue-400"
                  }`}
                  placeholder="Tu contraseña nueva"
                />
                {erroresForm.passwordNueva && <p className="text-red-500 text-sm mt-1">{erroresForm.passwordNueva}</p>}
              </div>
              <div>
                <label className="block text-base font-semibold mb-2">Confirmar contraseña</label>
                <input
                  type="password"
                  value={passwordConfirmar}
                  onChange={(e) => setPasswordConfirmar(e.target.value)}
                  className={`w-full border rounded-md px-4 py-2 focus:ring-2 focus:outline-none ${
                    erroresForm.passwordConfirmar ? "border-red-500 focus:ring-red-400" : "border-gray-300 focus:ring-blue-400"
                  }`}
                  placeholder="Confirma tu contraseña nueva"
                />
                {erroresForm.passwordConfirmar && <p className="text-red-500 text-sm mt-1">{erroresForm.passwordConfirmar}</p>}
              </div>
            </div>
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
              {submitting ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
