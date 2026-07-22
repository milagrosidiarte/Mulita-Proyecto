"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ComentarioInput from "./ComentarioInput";
import ModalImagenActividades from "./ModalImagenActividades";
import MenuAccionesActividades from "./MenuAccionesActividades";
import ModalColecciones from "./ModalColecciones";
import { useUser } from "@/hooks/queries";
import SkeletonComentarios from "./skeletons/SkeletonComentarios";

// ComentariosModal es un componente que muestra un modal con los comentarios de una actividad.
export default function ComentariosModal({ actividad, onClose, onActualizarComentarios }: any) {
  const [comentarios, setComentarios] = useState<any[]>([]); // Estado para almacenar los comentarios de la actividad
  const [loading, setLoading] = useState(true);
  const [modalImagenes, setModalImagenes] = useState(false); // Estado para controlar la apertura del modal de imágenes
  const [indexImagen, setIndexImagen] = useState(0); // Estado para almacenar el índice de la imagen seleccionada en la galería
  const [favoritos, setFavoritos] = useState<string[]>([]); // Estado para almacenar los IDs de las actividades que el usuario ha marcado como favoritas
  const [likesPorActividad, setLikesPorActividad] = useState<Record<string, number>>({}); // Estado para almacenar el número de likes por actividad
  const [modalColecciones, setModalColecciones] = useState(false); // Estado para controlar la apertura del modal de colecciones

  // Obtener información del usuario actual y verificar si es superAdmin
  const { user, isSuperAdmin } = useUser();

  // Función para cargar los comentarios de la actividad desde la API
  const cargarComentarios = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comunidad/comentarios/${actividad.id}`);
      if (!res.ok) throw new Error("Error al obtener comentarios");
      const data = await res.json();
      setComentarios(data);
    } catch (err) {
      console.error("Error cargando comentarios:", err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar favoritos del usuario
  const cargarFavoritos = async () => {
    try {
      const res = await fetch("/api/colecciones/favoritos");
      if (!res.ok) return;
      const data = await res.json();
      const favIds = data.map((f: { actividad_id: string }) => f.actividad_id); // Extraemos los IDs de las actividades favoritas del usuario
      setFavoritos(favIds);
    } catch (err) {
      console.error("Error al cargar favoritos", err);
    }
  };

  // Cargar contador de likes
  const cargarLikesCount = async () => {
    try {
      const res = await fetch(`/api/comunidad/actividades/${actividad.id}/likes`);
      if (!res.ok) throw new Error("Error al obtener likes");
      const data = await res.json();
      setLikesPorActividad((prev) => ({
        ...prev,
        [actividad.id]: data.count || 0,
      })); // Guardamos el número de likes de la actividad en el estado, manteniendo los likes de otras actividades si existen
    } catch (err) {
      console.error("Error al cargar likes:", err);
    }
  };

  // Efecto para cargar comentarios y likes cuando cambia la actividad
  useEffect(() => {
    if (actividad?.id) { // Verificamos que la actividad tenga un ID antes de cargar los comentarios y likes
      cargarComentarios();
      cargarLikesCount();
    }
    cargarFavoritos(); // Cargamos los favoritos del usuario al montar el componente
  }, [actividad.id]); // Dependencia: se ejecuta cuando cambia el ID de la actividad

  // Bloquear scroll de fondo mientras el modal está abierto
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // Toggles like - Optimistic Update
  const toggleLike = (actividadId: string) => {
    const estadoAnterior = favoritos; // Guardamos el estado anterior de favoritos para poder revertirlo si ocurre un error en la petición
    const likesAnteriores = likesPorActividad[actividadId] || 0; // Obtenemos el número de likes anterior para esta actividad, si no existe, asumimos 0
    const isFav = favoritos.includes(actividadId); // Verificamos si la actividad ya está en favoritos

    // Actualizar estado INMEDIATAMENTE (optimistic update)
    setFavoritos((prev) =>
      prev.includes(actividadId) // Si la actividad ya está en favoritos, la removemos del array, de lo contrario la agregamos
        ? prev.filter((id) => id !== actividadId) 
        : [...prev, actividadId]
    );

    // Actualizar contador de likes instantáneamente
    setLikesPorActividad((prev) => ({
      ...prev,
      [actividadId]: isFav ? likesAnteriores - 1 : likesAnteriores + 1, // Si estaba en favoritos, decrementamos el contador, de lo contrario lo incrementamos
    }));

    // Mostrar toast inmediatamente
    toast.success(isFav ? "Removido de favoritos" : "Agregado a favoritos");

    // Hacer el fetch en background (sin await)
    fetch(`/api/comunidad/actividades/${actividadId}/like`, { method: "POST" })
      .catch((err) => {
        console.error("Error al dar like:", err);
        // Revertir cambios si hay error
        setFavoritos(estadoAnterior);
        setLikesPorActividad((prev) => ({
          ...prev,
          [actividadId]: likesAnteriores,
        }));
        toast.error("Error al actualizar favorito");
      });
  };

  if (!user) {
    return (
      <div className="text-center text-gray-600 mt-10">
        Debes iniciar sesión para ver los comentarios.
      </div>
    );
  }

  // Función para eliminar un comentario, solo si el usuario es el autor o tiene rol de admin/superAdmin
  const handleEliminar = async (comentarioId: string) => {
    try {
      const res = await fetch(`/api/comunidad/comentarios/${comentarioId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Comentario eliminado");
        await cargarComentarios();
        if (onActualizarComentarios) onActualizarComentarios(); // Llamamos al callback para notificar al componente padre que los comentarios han sido actualizados
      } else {
        toast.error("No se pudo eliminar el comentario");
      }
    } catch (err) {
      console.error("Error eliminando comentario:", err);
      toast.error("Error al eliminar comentario");
    }
  };

  // Función para verificar si el usuario puede eliminar un comentario
  const puedeEliminar = (comentario: any) => {
    if (!user) return false;
    return (
      comentario.usuario_id === user.id ||
      user.rol === "admin" ||
      isSuperAdmin()
    );
  };

  // Filtrar imágenes y otros archivos de la actividad para mostrarlos en la galería y en la sección de descargas
  const imagenesAct = actividad.actividad_archivos?.filter((a: any) =>
    a.tipo.startsWith("image/") // Filtramos solo los archivos que son imágenes para mostrarlos en la galería
  );
  const otrosArchivos = actividad.actividad_archivos?.filter(
    (a: any) => !a.tipo.startsWith("image/") // Filtramos los archivos que no son imágenes para mostrarlos en la sección de descargas
  );
  const categorias = actividad.actividad_categoria?.map(
    (c: any) => c.categoria.nombre // Obtenemos los nombres de las categorías asociadas a la actividad para mostrarlas en la cabecera del modal
  );
  const isFav = favoritos.includes(actividad.id); // Verificamos si la actividad actual está en favoritos del usuario para mostrar el estado correcto del botón de like

  return (
    <div
      className="fixed inset-0 bg-gray-900/60 flex items-center justify-center z-[9999] px-4 py-6"
      onClick={(e) => {
        // Cerrar solo si se hace clic en el fondo, no en el modal
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Botón de cierre con fondo circular */}
      <button
        onClick={onClose}
        className="fixed top-6 right-70 z-[60] flex items-center justify-center w-10 h-10 rounded-full bg-black/70 text-white text-2xl hover:bg-black/90 transition-colors"
        aria-label="Cerrar"
      >
        ✕
      </button>

      {/* Contenedor del modal */}
      <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl w-full max-w-2xl relative shadow-lg flex flex-col max-h-[90vh] overflow-y-auto">
        {/* SECCIÓN SUPERIOR FIJA (CABECERA, DESCRIPCIÓN, GALERÍA) */}
        <div className="mb-4 pb-4 border-b border-gray-200 flex-shrink-0">
          {/* CABECERA */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                <img
                  src={actividad.usuario.perfil?.imagen || "/default-profile.png"} // Si el usuario no tiene imagen de perfil, mostramos una imagen por defecto
                  alt="Perfil"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div>
                <p className="font-semibold text-gray-800">
                  {actividad.usuario?.nombre} {actividad.usuario?.apellido} 
                </p>
                <p className="text-xs text-gray-500">{actividad.fecha}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {categorias?.map((cat: string, i: number) => (
                <span
                  key={i}
                  className="shadow border border-[#f1f3f7] bg-white rounded px-2 py-1 text-xs font-semibold text-gray-700"
                >
                  {cat}
                </span>
              ))}

              <MenuAccionesActividades // Componente que muestra un menú de acciones para la actividad, como editar o eliminar, dependiendo del rol del usuario
                actividad={{ id: actividad.id, usuario_id: actividad.usuario.id }}
                userId={user?.id ?? ""}
                rol={user?.rol ?? ""}
              />
            </div>
          </div>

          {/* TÍTULO Y DESCRIPCIÓN */}
          <h2 className="text-lg font-bold text-[#003c71] mb-2">
            {actividad.titulo}
          </h2>
          <p className="text-sm mb-4 text-gray-700 whitespace-pre-line">{actividad.descripcion}</p>

          {/* ARCHIVOS DESCARGABLES */}
          {otrosArchivos?.length > 0 && (
            <div className="flex flex-col gap-1 mb-4">
              {otrosArchivos.map((a: any, i: number) => (
                <a
                  key={i}
                  href={a.archivo_url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-2 truncate"
                  title={a.nombre}
                >
                  📎 <span className="truncate">Descargar archivo: {a.nombre}</span>
                </a>
              ))}
            </div>
          )}

          {/* GALERÍA DE IMÁGENES */}
          {imagenesAct?.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4 overflow-hidden">
              {imagenesAct.slice(0, 2).map((img: any, i: number) => (
                <button
                  key={i}
                  onClick={() => {
                    setIndexImagen(i);
                    setModalImagenes(true);
                  }}
                  className="aspect-square overflow-hidden rounded-md"
                >
                  <img
                    src={img.archivo_url}
                    alt={`Imagen ${i + 1}`}
                    className="object-cover w-full h-full"
                  />
                </button>
              ))}
              {/* Indicador de más imágenes */}
              {imagenesAct.length > 2 && (
                <button
                  onClick={() => {
                    setIndexImagen(2);
                    setModalImagenes(true);
                  }}
                  className="aspect-square rounded-md flex items-center justify-center text-gray-700 text-2xl font-bold transition relative overflow-hidden bg-gray-200"
                >
                  <span className="relative z-10">+{imagenesAct.length - 2}</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex items-center gap-4 text-gray-600 pt-3 border-t border-gray-200 text-sm mb-3 flex-shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => toggleLike(actividad.id)}
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
            <span className="text-sm text-gray-700 font-semibold">
              {likesPorActividad[actividad.id] ?? 0}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button className="hover:opacity-75 transition">
              <img
                src="/images/icons/comunidad/comentarios.svg"
                alt="Comentarios"
                className="w-6 h-6"
              />
            </button>
            <span className="text-sm text-gray-700 font-semibold">{comentarios.length}</span>
          </div>

          <button 
            onClick={() => setModalColecciones(true)}
            className="hover:opacity-75 transition">
            <img
              src="/images/icons/comunidad/colecciones.svg"
              alt="Guardar"
              className="w-6 h-6"
            />
          </button>
        </div>

        <ComentarioInput
          actividadId={actividad.id}
          onNuevoComentario={async () => {
            await cargarComentarios();
            if (onActualizarComentarios) onActualizarComentarios();
          }}
        />

        {/* COMENTARIOS - SECCIÓN DESPLAZABLE */}
        <div className="border-t border-gray-200 pt-3 flex-1 min-h-0">
          <h3 className="text-sm font-medium mb-2 text-black pb-2">Comentarios</h3>

          {loading ? (
            <SkeletonComentarios />
          ) : comentarios.length === 0 ? (
            <p className="text-sm text-gray-500">Sin comentarios aún.</p>
          ) : (
            <div className="space-y-3">
              {comentarios.map((c) => (
                <div key={c.id} className="border-b border-gray-100 pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      {c.usuario?.perfil?.imagen ? (
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                          <img
                            src={c.usuario.perfil.imagen}
                            alt={`${c.usuario?.nombre} ${c.usuario?.apellido}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs">
                          {c.usuario?.nombre?.[0]?.toUpperCase() ?? "?"}
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-black">
                          <strong className="font-semibold text-black">
                            {c.usuario?.nombre} {c.usuario?.apellido}
                          </strong>
                          : {c.contenido}
                        </p>
                        <span className="text-xs text-gray-500">{c.fecha}</span>
                      </div>
                    </div>

                    {puedeEliminar(c) && (
                      <button
                        onClick={() => handleEliminar(c.id)}
                        className="text-gray-400 hover:text-red-600 transition text-lg font-bold"
                        title="Eliminar comentario"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Modal de imágenes */}
      {modalImagenes && (
        <ModalImagenActividades
          images={imagenesAct.map((img: any) => img.archivo_url)}
          initialIndex={indexImagen}
          onClose={() => setModalImagenes(false)}
        />
      )}

      {/* Modal de colecciones */}
      <ModalColecciones
        isOpen={modalColecciones}
        actividadId={actividad.id}
        onClose={() => setModalColecciones(false)}
      />
    </div>
  );
}
