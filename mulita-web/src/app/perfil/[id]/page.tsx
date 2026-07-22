"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/hooks/queries";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import ActividadesUsuario from "@/components/ui/perfil/ActividadesUsuario";
import ColeccionesUsuario from "@/components/ui/perfil/ColeccionesUsuario";
import SkeletonPerfil from "@/components/ui/perfil/skeletons/SkeletonPerfil";

// Definición de la interfaz Usuario para tipar los datos del usuario
interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
}

// Definición de la interfaz Perfil para tipar los datos del perfil
interface Perfil {
  biografia: string;
  imagen: string;
  usuario: Usuario;
}

// Componente principal de la página de perfil
export default function PerfilPage() {
  const { id } = useParams(); // Obtener el ID del perfil desde los parámetros de la URL
  const { user, logout } = useUser(); // Obtener el usuario actual y la función de cierre de sesión desde el hook useUser
  const router = useRouter(); // Obtener el objeto router para la navegación programática
  const searchParams = useSearchParams(); // Obtener los parámetros de búsqueda de la URL para determinar la vista actual (actividades, colecciones o favoritos)

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<"colecciones" | "actividades" | "favoritos">("actividades");

  const [mostrarInput, setMostrarInput] = useState(false); // Estado para controlar la visibilidad del input de nueva colección
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [mensajeError, setMensajeError] = useState("");

  // Leer la query 'vista' y actualizar el estado
  useEffect(() => {
    const vistaParam = searchParams.get("vista");
    if (vistaParam === "actividades" || vistaParam === "colecciones" || vistaParam === "favoritos") {
      setVista(vistaParam);
    }
  }, [searchParams]); // Dependencia de searchParams para actualizar la vista cuando cambie la URL

  // Traer datos del perfil desde la API
  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/perfil/${id}`);
        if (!res.ok) throw new Error("Perfil no encontrado");
        const data = await res.json();
        setPerfil(data.perfil);
      } catch (err) {
        console.error(err);
        setPerfil(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPerfil();
  }, [id]);

  if (loading)
    return <SkeletonPerfil />;

  if (!perfil)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600 text-lg">
        Perfil no encontrado
      </div>
    );

  // Determinar si el usuario actual es el propietario del perfil
  const esPropietario = user?.id === perfil.usuario.id;

  //  Función para crear una nueva colección
  const handleCrearColeccion = async () => {
    if (!nuevoNombre.trim()) {
      setMensajeError("El nombre no puede estar vacío.");
      return;
    }

    try {
      const res = await fetch("/api/colecciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nuevoNombre.trim(), // Trim para eliminar espacios en blanco al inicio y al final
          usuario_id: perfil.usuario.id, // ID del usuario propietario del perfil
        }),
      });

      if (!res.ok) throw new Error("Error al crear la colección");

      const nueva = await res.json(); // Obtener la respuesta de la API con los datos de la nueva colección
      console.log("Colección creada:", nueva); // Log para verificar que la colección se creó correctamente

      setNuevoNombre(""); // Limpiar el input después de crear la colección
      setMensajeError("");
      setMostrarInput(false);
      router.refresh();
    } catch (error) {
      console.error(error);
      setMensajeError("No se pudo crear la colección.");
    }
  };

  return (
    <div className="w-full min-h-screen bg-white flex flex-col items-center justify-start text-xs text-[#6d758f] font-inter">
      {/* Sección superior del perfil */}
      <div className="w-full flex flex-col items-center text-center p-[30px_170px] relative">
        <div className="flex items-start gap-10 text-left text-2xl text-black font-roboto">
          {/* Flecha al costado del avatar */}
          <div className="flex items-start">
            <button
              onClick={() => router.back()}
              className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              title="Volver"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>

          {/* Avatar */}
          <div className="w-[120px] h-[120px] rounded-full overflow-hidden flex-shrink-0 border border-gray-200 shadow-sm">
            <img
              src={perfil.imagen || "/images/icons/perfil/default-avatar.svg"}
              alt="Avatar"
              className={`w-full h-full object-cover ${!perfil.imagen ? "scale-50" : ""}`}
            />
          </div>

          {/* Info usuario */}
          <div className="flex-1 flex flex-col items-center gap-3">
            <b className="w-full leading-8 text-center text-black text-2xl">
              {perfil.usuario.nombre} {perfil.usuario.apellido}
            </b>
            <div className="w-full text-base leading-6 text-[#6d758f] text-center">
              {perfil.usuario.email}
            </div>
            {perfil.biografia && (
              <p className="text-sm max-w-xl text-[#6d758f] mt-2">{perfil.biografia}</p>
            )}
          </div>

          {/* Botones (solo si es su perfil) */}
          {esPropietario && (
            <div className="flex flex-col items-start gap-3 text-base text-[#003c71]">
              <button
                onClick={() => logout()}
                className="w-[160px] rounded-lg border border-[#fedd00] flex items-center justify-center py-3 cursor-pointer"
              >
                <span className="leading-6 font-medium">Cerrar sesión</span>
              </button>

              <button
                onClick={() => router.push(`/perfil/editar/${perfil.usuario.id}`)}
                className="w-[160px] rounded-lg bg-[#003c71] text-white flex items-center justify-center py-3 cursor-pointer"
              >
                <span className="leading-6 font-medium">Editar perfil</span>
              </button>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 w-full h-px bg-gray-200" />
      </div>

      {/* Menú de secciones */}
      <div className="w-full flex justify-center py-8">
        <div className="flex items-center gap-3 text-center text-sm text-[#6d758f]">
          <div
            onClick={() => setVista("actividades")}
            className={`shadow-sm rounded border px-4 py-2 cursor-pointer ${
              vista === "actividades"
                ? "bg-[#003c71] text-white border-[#003c71]"
                : "bg-[#f8faff] border-[#f1f3f7] text-[#003c71]"
            }`}
          >
            <span className="font-semibold text-sm">Actividades</span>
          </div>

          <div
            onClick={() => setVista("favoritos")}
            className={`shadow-sm rounded border px-4 py-2 cursor-pointer ${
              vista === "favoritos"
                ? "bg-[#003c71] text-white border-[#003c71]"
                : "bg-[#f8faff] border-[#f1f3f7] text-[#003c71]"
            }`}
          >
            <span className="font-semibold text-sm">Favoritos</span>
          </div>

          <div
            onClick={() => setVista("colecciones")}
            className={`shadow-sm rounded border px-4 py-2 cursor-pointer ${
              vista === "colecciones"
                ? "bg-[#003c71] text-white border-[#003c71]"
                : "bg-[#f8faff] border-[#f1f3f7] text-[#003c71]"
            }`}
          >
            <span className="font-semibold text-sm">Colecciones</span>
          </div>

          {/* Botón de nueva colección con animación */}
          {esPropietario && (
            <div className="flex items-center gap-2">
              <AnimatePresence mode="wait">
                {!mostrarInput ? (
                  <motion.button
                    key="abrir"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 40 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => setMostrarInput(true)}
                    className="rounded border border-[#fedd00] px-4 py-2 text-[#003c71] cursor-pointer font-semibold text-sm"
                  >
                    Nueva colección
                  </motion.button>
                ) : (
                  <motion.div
                    key="input"
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 40 }}
                    transition={{ duration: 0.4 }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      value={nuevoNombre}
                      onChange={(e) => setNuevoNombre(e.target.value)}
                      placeholder="Nombre de la colección"
                      className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#fedd00]"
                      autoFocus
                    />
                    <button
                      onClick={handleCrearColeccion}
                      className="bg-[#003c71] text-white px-3 py-1 rounded hover:bg-[#002855]"
                    >
                      Crear
                    </button>
                    <button
                      onClick={() => setMostrarInput(false)}
                      className="text-gray-500 hover:text-red-500 text-sm"
                    >
                      ✕
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Contenido dinámico */}
      <div className="w-full text-left px-[170px] pb-25">
        {vista === "actividades" ? (
          <ActividadesUsuario usuarioId={perfil.usuario.id} perfilImagen={perfil.imagen} /> // Renderizar actividades del usuario
        ) : vista === "colecciones" ? (
          <ColeccionesUsuario userPerfilId={perfil.usuario.id} /> // Renderizar colecciones del usuario
        ) : (
          <ActividadesUsuario
            usuarioId={perfil.usuario.id}
            perfilImagen={perfil.imagen}
            mostrarSoloFavoritos
          /> // Renderizar solo actividades favoritas del usuario
        )}
      </div>
    </div>
  );
}
