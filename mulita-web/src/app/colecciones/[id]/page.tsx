"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import MenuAccionesActividades from "@/components/ui//comunidad/MenuAccionesActividades"; // Componente para mostrar el menú de acciones de actividades
import ModalImagenActividades from "@/components/ui/comunidad/ModalImagenActividades"; // Componente para mostrar las imágenes de actividades en un modal
import ComentarioInput from "@/components/ui/comunidad/ComentarioInput"; // Componente para agregar comentarios a una actividad
import ComentariosModal from "@/components/ui/comunidad/ComentariosModal"; // Componente para mostrar los comentarios de una actividad en un modal
import ModalColecciones from "@/components/ui/comunidad/ModalColecciones"; // Componente para mostrar el modal de colecciones y permitir agregar una actividad a una colección
import { useUser } from "@/hooks/queries"; // Hook personalizado para obtener los datos del usuario autenticado
import { useParams } from "next/navigation";
import SkeletonColeccionDetalle from "@/components/ui/perfil/skeletons/SkeletonColeccionDetalle";

// Tipos de datos 
type Archivo = { archivo_url: string; tipo: string; nombre: string };
type Categoria = { categoria: { nombre: string } };
type Perfil = { imagen?: string };
type Usuario = { id: string; nombre: string; apellido: string; perfil: Perfil };
type Actividad = {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha: string;
  created_at: string;
  usuario_id: string;
  usuario: Usuario;
  actividad_archivos?: Archivo[];
  actividad_categoria?: Categoria[];
};

// Componente principal de la página de detalle de colección
export default function ColeccionDetallePage() {
  const router = useRouter();
  const { id } = useParams();
  if (!id) return null;

  const { user } = useUser();
  const [nombreColeccion, setNombreColeccion] = useState("");
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [favoritos, setFavoritos] = useState<string[]>([]); // ✅ nuevo estado
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imagenes, setImagenes] = useState<Archivo[]>([]);

  const [actividadSeleccionada, setActividadSeleccionada] = useState<Actividad | null>(null);
  const [modalColeccionesOpen, setModalColeccionesOpen] = useState(false);
  const [actividadParaColeccion, setActividadParaColeccion] = useState<string | null>(null);
  const [comentariosPorActividad, setComentariosPorActividad] = useState<Record<string, number>>({});

  // traer comentarios
  const fetchComentariosCount = async (actividadId: string) => {
    try {
      const res = await fetch(`/api/comunidad/comentarios/${actividadId}`);
      if (!res.ok) throw new Error("Error al obtener comentarios");
      const data = await res.json();
      return data.length;
    } catch (err) {
      console.error(err);
      return 0;
    }
  };

  // actualizar comentarios, cuando se agrega un nuevo comentario, se actualiza el contador de comentarios en la actividad correspondiente
  const actualizarComentarios = (actividadId: string, nuevoCount: number) => {
    setComentariosPorActividad((prev) => ({ ...prev, [actividadId]: nuevoCount }));
  };

  // obtener colección con actividades
  useEffect(() => {
    const fetchColeccion = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/colecciones/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al obtener la colección");

        setNombreColeccion(data.nombre || "");
        const acts: Actividad[] = data.actividades || [];
        setActividades(acts);
        console.log("actividades", acts);

        const counts: Record<string, number> = {}; // Objeto para almacenar el conteo de comentarios por actividad
        await Promise.all( // Esperamos a que todos los conteos de comentarios se completen antes de actualizar el estado
          acts.map(async (act) => {
            counts[act.id] = await fetchComentariosCount(act.id); // Obtenemos el conteo de comentarios para cada actividad
          })
        );
        setComentariosPorActividad(counts); // Actualizamos el estado con los conteos de comentarios por actividad
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchColeccion();
  }, [id]);

  // obtener favoritos (likes del usuario)
  const fetchFavoritos = useCallback(async () => {
    try {
      const res = await fetch("/api/colecciones/favoritos");
      if (!res.ok) return;
      const data = await res.json();
      const favIds = data.map((f: { actividad_id: string }) => f.actividad_id); // Extraemos solo los IDs de las actividades favoritas
      setFavoritos(favIds); // Actualizamos el estado con los IDs de las actividades favoritas del usuario
    } catch (err) {
      console.error("Error al cargar favoritos", err);
    }
  }, []);

  
  useEffect(() => {
    fetchFavoritos(); // Cargar favoritos al montar el componente
  }, [fetchFavoritos]);

  // alternar like - Optimistic Update
  const toggleLike = (actividadId: string) => {
    // Guardar estado anterior en caso de necesitar revertir
    const estadoAnterior = favoritos;

    // Actualizar estado INMEDIATAMENTE (optimistic update)
    setFavoritos((prev) =>
      prev.includes(actividadId)
        ? prev.filter((id) => id !== actividadId)
        : [...prev, actividadId]
    );

    // Hacer el fetch en background (sin await) porque ya actualizamos el estado optimisticamente
    fetch(`/api/comunidad/actividades/${actividadId}/like`, {
      method: "POST",
    })
      .catch((err) => {
        console.error("Error al dar like:", err);
        // Revertir cambios si hay error
        setFavoritos(estadoAnterior);
      });
  };

  // Funcion para manejar la expansión de la descripción
  const toggleExpand = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] })); 

  // Función para abrir el modal de imágenes y establecer la imagen actual
  const toggleModal = (imagenes: Archivo[], index: number) => {
    setImagenes(imagenes);
    setCurrentIndex(index);
    setModalOpen(true);
  };

  if (loading)
    return <SkeletonColeccionDetalle />;
  if (error) 
    return (
      <div className="p-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => router.back()}
            className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            title="Volver"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <p className="text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  if (actividades.length === 0)
    return (
      <div className="p-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => router.back()}
            className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            title="Volver"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <p className="text-gray-400">No hay actividades en esta colección.</p>
        </div>
      </div>
    );

  if (!user)
    return (
      <div className="text-center text-gray-600 mt-10">
        Debes iniciar sesión para ver las actividades.
      </div>
    );

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => router.back()}
          className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          title="Volver"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-semibold text-[#003c71]">
          {`Actividades de "${nombreColeccion}"`}
        </h2>
      </div>
      
      <div className="flex flex-col gap-8">
        {actividades.map((act) => {
          const imagenesAct = act.actividad_archivos?.filter((a) => a.tipo.startsWith("image/")) || [];
          const otrosArchivos = act.actividad_archivos?.filter((a) => !a.tipo.startsWith("image/")) || [];
          const categorias = act.actividad_categoria?.map((c) => c.categoria.nombre);
          const isFav = favoritos.includes(act.id);

          return (
            <div
              key={act.id}
              className="w-full bg-white rounded-2xl shadow border border-gray-200 p-5 flex flex-col gap-4"
            >
              {/* CABECERA */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                    <img
                      src={act.usuario.perfil.imagen || "/images/icons/perfil/default-avatar.svg"}
                      alt="Perfil"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {act.usuario?.nombre} {act.usuario?.apellido}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(act.fecha).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {categorias?.map((cat, i) => (
                    <span
                      key={i}
                      className="shadow border border-[#f1f3f7] bg-white rounded px-2 py-1 text-xs font-semibold text-gray-700"
                    >
                      {cat}
                    </span>
                  ))}
                  <MenuAccionesActividades
                    actividad={{ id: act.id, usuario_id: act.usuario.id }}
                    userId={user.id}
                    rol={user.rol}
                  />
                </div>
              </div>

              {/* TÍTULO */}
              <h3 className="text-lg font-bold text-[#003c71] -mb-2">{act.titulo}</h3>

              {/* DESCRIPCIÓN */}
              {act.descripcion && (
                <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                  {expanded[act.id]
                    ? act.descripcion
                    : act.descripcion.length > 200
                    ? act.descripcion.slice(0, 200) + "..."
                    : act.descripcion}
                  {act.descripcion.length > 200 && (
                    <button
                      onClick={() => toggleExpand(act.id)}
                      className="text-[#003c71] ml-2 font-semibold hover:underline"
                    >
                      {expanded[act.id] ? "Ver menos" : "Ver más"}
                    </button>
                  )}
                </div>
              )}

              {/* ARCHIVOS */}
              {otrosArchivos.length > 0 && (
                <div className="flex flex-col gap-1 mt-2">
                  {otrosArchivos.map((a, i) => (
                    <a
                      key={i}
                      href={a.archivo_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      title={a.nombre}
                      className="text-sm text-blue-600 hover:underline flex items-center gap-2 truncate"
                    >
                      <span className="flex-shrink-0">📎</span>
                      <span className="truncate">Descargar archivo: {a.nombre}</span>
                    </a>
                  ))}
                </div>
              )}

              {/* GALERÍA */}
              {imagenesAct.length > 0 && (
                <div className="px-4 pb-4 grid grid-cols-3 gap-2">
                  {imagenesAct.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => toggleModal(imagenesAct, i)}
                      className="w-full aspect-square overflow-hidden rounded-md"
                    >
                      <img src={img.archivo_url} alt={`Imagen ${i + 1}`} className="object-cover w-full h-full" />
                    </button>
                  ))}
                </div>
              )}

              {/* BOTONES */}
              <div className="flex items-center gap-4 text-gray-600 pt-3 border-t border-gray-200 text-sm">
                {/* Me gusta */}
                <button
                  onClick={() => toggleLike(act.id)}
                  className="hover:opacity-75 transition"
                >
                  <img
                    src={
                      isFav
                        ? "/images/icons/comunidad/favoritos-fill.svg"
                        : "/images/icons/comunidad/favoritos.svg"
                    }
                    alt="Me gusta"
                    className="w-6 h-6"
                  />
                </button>

                <div className="flex items-center gap-1">
                  <button
                    className="hover:opacity-75 transition"
                    onClick={() => setActividadSeleccionada(act)}
                  >
                    <img
                      src="/images/icons/comunidad/comentarios.svg"
                      alt="Comentarios"
                      className="w-6 h-6"
                    />
                  </button>
                  <span className="text-sm text-gray-700 font-semibold">
                    {comentariosPorActividad[act.id] ?? 0}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setActividadParaColeccion(act.id);
                    setModalColeccionesOpen(true);
                  }}
                  className="hover:opacity-75 transition"
                >
                  <img
                    src="/images/icons/comunidad/colecciones.svg"
                    alt="Guardar"
                    className="w-6 h-6"
                  />
                </button>
              </div>

              <ComentarioInput
                actividadId={act.id}
                onNuevoComentario={async () => {
                  const count = await fetchComentariosCount(act.id); // Obtenemos el nuevo conteo de comentarios después de agregar uno
                  actualizarComentarios(act.id, count); // Actualizamos el estado con el nuevo conteo de comentarios
                }}
              />
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <ModalImagenActividades
          images={imagenes.map((img) => img.archivo_url)}
          initialIndex={currentIndex}
          onClose={() => setModalOpen(false)}
        />
      )}

      {actividadSeleccionada && (
        <ComentariosModal
          actividad={actividadSeleccionada}
          onClose={() => setActividadSeleccionada(null)}
          onActualizarComentarios={async () => {
            // Actualizamos el conteo de comentarios después de que el usuario agregue uno
            const count = await fetchComentariosCount(actividadSeleccionada.id); 
            actualizarComentarios(actividadSeleccionada.id, count);
          }}
        />
      )}

      {actividadParaColeccion && (
        <ModalColecciones
          isOpen={modalColeccionesOpen}
          onClose={() => {
            setModalColeccionesOpen(false);
            setActividadParaColeccion(null);
          }}
          actividadId={actividadParaColeccion} // ID de la actividad a la que se quiere agregar a las colecciones
        />
      )}
    </div>
  );
}
