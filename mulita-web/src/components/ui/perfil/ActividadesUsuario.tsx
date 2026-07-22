"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import MenuAccionesActividades from "@/components/ui/comunidad/MenuAccionesActividades";
import ModalImagenActividades from "@/components/ui/comunidad/ModalImagenActividades";
import ComentarioInput from "@/components/ui/comunidad/ComentarioInput";
import ComentariosModal from "@/components/ui/comunidad/ComentariosModal";
import ModalColecciones from "@/components/ui/comunidad/ModalColecciones";
import { FiltroCategoria, FiltroFecha } from "@/components/ui/comunidad/Filtros";
import { useUser } from "@/hooks/queries";
import { SkeletonActividadesUsuario } from "./skeletons/SkeletonActividadesUsuario";

// Formas de los datos que devuelve la API
type Archivo = { archivo_url: string; tipo: string; nombre: string };
type Categoria = { categoria: { nombre: string } };
type Perfil = { imagen?: string };
type Usuario = { id: string; nombre: string; apellido: string; perfil: Perfil };
type Actividad = {
  id: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  usuario_id: string;
  usuario: Usuario;
  actividad_archivos: Archivo[];
  actividad_categoria: Categoria[];
};

// Props del componente, incluyendo el ID del usuario, la imagen de perfil opcional y si se deben mostrar solo favoritos
type Props = {
  usuarioId: string;
  perfilImagen?: string;
  mostrarSoloFavoritos?: boolean; // si es true, solo se muestran las actividades que están en la colección "Favoritos"
};

// Componente principal que muestra las actividades de un usuario, 
// con filtros, favoritos y modales para imágenes y comentarios
export default function ActividadesUsuario({
  usuarioId,
  perfilImagen,
  mostrarSoloFavoritos = false, 
}: Props) {
  const { user } = useUser();
  const [actividades, setActividades] = useState<Actividad[]>([]); // Lista de actividades del usuario
  const [favoritos, setFavoritos] = useState<string[]>([]); // IDs de actividades favoritas
  const [expanded, setExpanded] = useState<Record<string, boolean>>({}); // para controlar qué descripciones están expandidas
  const [loadingInicial, setLoadingInicial] = useState(false); // para controlar el estado de carga inicial
  const [loadingVerMas, setLoadingVerMas] = useState(true) // para controlar el estado de carga al hacer "Ver más"
  const [error, setError] = useState<string | null>(null); // para manejar errores de carga
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([]); // para manejar los filtros de categorías
  const [fechaSeleccionada, setFechaSeleccionada] = useState(""); // para manejar los filtros de fecha

  const [modalOpen, setModalOpen] = useState(false); // para controlar la apertura del modal de imágenes
  const [currentIndex, setCurrentIndex] = useState(0); // para controlar el índice de la imagen actual en el modal
  const [imagenes, setImagenes] = useState<Archivo[]>([]); // para almacenar las imágenes de la actividad seleccionada

  const [actividadSeleccionada, setActividadSeleccionada] = useState<Actividad | null>(null); // para controlar la actividad seleccionada para el modal de comentarios
  const [modalColeccionesOpen, setModalColeccionesOpen] = useState(false); // para controlar la apertura del modal de colecciones
  const [actividadParaColeccion, setActividadParaColeccion] = useState<string | null>(null); // para almacenar el ID de la actividad que se quiere agregar a una colección

  const [comentariosPorActividad, setComentariosPorActividad] = useState<Record<string, number>>({}); // para almacenar la cantidad de comentarios por actividad
  const [likesPorActividad, setLikesPorActividad] = useState<Record<string, number>>({}); // para almacenar la cantidad de likes por actividad
  const [ultimoComentario, setUltimoComentario] = useState<Record<string, any>>({}); // para almacenar el último comentario por actividad
  const [offset, setOffset] = useState(0); // para manejar la paginación de actividades
  const [hasMore, setHasMore] = useState(true); // para indicar si hay más actividades para cargar
  const [showScrollButton, setShowScrollButton] = useState(false); // para controlar la visibilidad del botón de "subir arriba"

  const limit = 5; // cantidad de actividades a traer por página

  // Obtiene la cantidad de comentarios de una actividad
  // (si falla, devuelve 0 en vez de romper la UI — no es dato crítico)
  const fetchComentariosCount = async (actividadId: string) => {
    try {
      const res = await fetch(`/api/comunidad/comentarios/${actividadId}`);
      if (!res.ok) throw new Error("Error al obtener comentarios");
      const data = await res.json();
      return data.length;
    } catch {
      return 0; // Silenciosamente ignorar errores y devolver 0
    }
  };

  // Obtiene la cantidad de likes de una actividad
  const fetchLikesCount = async (actividadId: string) => {
    try {
      const res = await fetch(`/api/comunidad/actividades/${actividadId}/likes`);
      if (!res.ok) throw new Error("Error al obtener likes");
      const data = await res.json();
      return data.count || 0; // Asegurarse de devolver un número
    } catch {
      return 0; // Silenciosamente ignorar errores y devolver 0
    }
  };

  // Obtiene el último comentario de una actividad y lo guarda en el estado solo si hay comentarios
  const fetchUltimoComentario = async (actividadId: string) => {
    try {
      const res = await fetch(`/api/comunidad/comentarios/${actividadId}`);
      if (!res.ok) throw new Error("Error al obtener comentarios");
      const data = await res.json();
      if (data.length > 0) {
        setUltimoComentario((prev) => ({ 
          ...prev,
          [actividadId]: data[data.length - 1],
        }));
      }
    } catch {
      // Silenciosamente ignorar errores
    }
  };

  // Actualiza la cantidad de comentarios de una actividad
  const actualizarComentarios = (actividadId: string, nuevoCount: number) => { 
    setComentariosPorActividad((prev) => ({ ...prev, [actividadId]: nuevoCount })); // Actualiza el estado con la nueva cantidad de comentarios
  };

  // Actualiza la cantidad de likes de una actividad
  const actualizarLikes = (actividadId: string, nuevoCount: number) => {
    setLikesPorActividad((prev) => ({ ...prev, [actividadId]: nuevoCount }));
  };

  // Trae todas las actividades o solo los favoritos
  const fetchActividades = useCallback( // useCallback porque se usa como dependencia de useEffect para recargar actividades al cambiar filtros
    async (newOffset = 0, categorias: string[] = [], fecha = "") => { // newOffset es para paginación, categorias y fecha son filtros
      try {
        if (newOffset === 0) {
          setLoadingInicial(true); // Si es la primera carga, mostrar el skeleton
        } else {
          setLoadingVerMas(true); // Si es "Ver más", mostrar el spinner en el botón
        }
        let data: Actividad[] = []; // Variable para almacenar las actividades que se van a mostrar

        // Obtener todas las colecciones del usuario ---
        const resColecciones = await fetch(`/api/colecciones?userId=${usuarioId}`);
        if (!resColecciones.ok) throw new Error("Error al obtener las colecciones del usuario");

        const colecciones = await resColecciones.json();
        const coleccionFavoritos = colecciones.find(
          (c: any) => c.nombre?.toLowerCase() === "favoritos"
        );

        // Si hay favoritos, traer sus actividades
        let idsFavoritos: string[] = [];
        if (coleccionFavoritos) {
          const resFav = await fetch(`/api/colecciones/${coleccionFavoritos.id}`);
          if (resFav.ok) {
            const favData = await resFav.json();
            idsFavoritos = (favData.actividades || []).map((a: Actividad) => a.id);
            setFavoritos(idsFavoritos);
          }
        }

        // Si se muestran solo favoritos, usar esos datos para filtrar y ordenar, sino traer las actividades del usuario
        if (mostrarSoloFavoritos && coleccionFavoritos) { // Si se muestran solo favoritos y existe la colección de favoritos, traer sus actividades
          const resFav = await fetch(`/api/colecciones/${coleccionFavoritos.id}`);
          if (!resFav.ok) throw new Error("Error al obtener actividades favoritas");

          const coleccionData = await resFav.json();
          data = coleccionData.actividades || []; // Guardar las actividades favoritas en data
          
          // Aplicar filtros a los favoritos
          if (categorias.length > 0) {
            data = data.filter((act: Actividad) => {
              const actCategorias = act.actividad_categoria?.map((c: any) => c.categoria.nombre) || []; // Obtener los nombres de las categorías de la actividad
              return categorias.some(cat => actCategorias.includes(cat));// Filtrar si alguna de las categorías seleccionadas está en las categorías de la actividad
            });
          }
          
          if (fecha) {
            // Ordenamiento por fecha
            if (fecha === "nuevo_antiguo") { // Ordenar de más reciente a más antiguo
              data = data.sort((a: Actividad, b: Actividad) => 
                new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
              );
            } else if (fecha === "antiguo_nuevo") { // Ordenar de más antiguo a más reciente
              data = data.sort((a: Actividad, b: Actividad) => 
                new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
              );
            } else if (fecha === "hoy") { // Filtrar solo las actividades de hoy
              const hoy = new Date().toLocaleDateString('es-AR');
              data = data.filter((act: Actividad) => 
                new Date(act.fecha).toLocaleDateString('es-AR') === hoy
              );
            } else if (fecha === "semana") { // Filtrar solo las actividades de la última semana
              const ahora = new Date();
              const hace7dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
              data = data.filter((act: Actividad) => {
                const actFecha = new Date(act.fecha);
                return actFecha >= hace7dias && actFecha <= ahora;
              });
            } else if (fecha === "mes") { // Filtrar solo las actividades del último mes
              const ahora = new Date();
              const hace30dias = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
              data = data.filter((act: Actividad) => {
                const actFecha = new Date(act.fecha);
                return actFecha >= hace30dias && actFecha <= ahora;
              });
            }
          }
        } else {
          // Si no, traer las actividades del usuario
          const res = await fetch(
            `/api/perfil/${usuarioId}/actividades?offset=${newOffset}&limit=${limit}` // Traer actividades del usuario con paginación
          );
          if (!res.ok) throw new Error("Error al obtener las actividades del usuario");
          data = await res.json();
          setHasMore(data.length === limit); // Si la cantidad de actividades traídas es igual al límite, hay más para cargar
          
          // Aplicar filtros en cliente, lo mismo pero para las actividades del usuario y no solo para los favoritos
          if (categorias.length > 0) {
            data = data.filter((act: Actividad) => {
              const actCategorias = act.actividad_categoria?.map((c: any) => c.categoria.nombre) || [];
              return categorias.some(cat => actCategorias.includes(cat));
            });
          }
          
          if (fecha) {
            // Ordenamiento por fecha
            if (fecha === "nuevo_antiguo") {
              data = data.sort((a: Actividad, b: Actividad) => 
                new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
              );
            } else if (fecha === "antiguo_nuevo") {
              data = data.sort((a: Actividad, b: Actividad) => 
                new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
              );
            } else if (fecha === "hoy") {
              const hoy = new Date().toLocaleDateString('es-AR');
              data = data.filter((act: Actividad) => 
                new Date(act.fecha).toLocaleDateString('es-AR') === hoy
              );
            } else if (fecha === "semana") {
              const ahora = new Date();
              const hace7dias = new Date(ahora.getTime() - 7 * 24 * 60 * 60 * 1000);
              data = data.filter((act: Actividad) => {
                const actFecha = new Date(act.fecha);
                return actFecha >= hace7dias && actFecha <= ahora;
              });
            } else if (fecha === "mes") {
              const ahora = new Date();
              const hace30dias = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);
              data = data.filter((act: Actividad) => {
                const actFecha = new Date(act.fecha);
                return actFecha >= hace30dias && actFecha <= ahora;
              });
            }
          }
        }

        // Agregar campo 'isFav' a cada actividad ---
        const actividadesConLike = data.map((act) => ({
          ...act,
          isFav: idsFavoritos.includes(act.id),
        }));

        // Actualizar estado ---
        if (newOffset === 0) setActividades(actividadesConLike);
        else setActividades((prev) => [...prev, ...actividadesConLike]);

        // Cargar cantidad de comentarios, likes y último comentario
        const counts: Record<string, number> = {};
        const likes: Record<string, number> = {};
        await Promise.all( // una promesa sirve para esperar a que todas las llamadas asíncronas terminen antes de continuar
          data.map(async (act) => {
            counts[act.id] = await fetchComentariosCount(act.id);
            likes[act.id] = await fetchLikesCount(act.id);
            await fetchUltimoComentario(act.id);
          })
        );
        setComentariosPorActividad((prev) => ({ ...prev, ...counts }));
        setLikesPorActividad((prev) => ({ ...prev, ...likes }));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingInicial(false);
        setLoadingVerMas(false);
      }
    },
    [usuarioId, mostrarSoloFavoritos] // Dependencias: si cambia el usuario o si se cambia entre mostrar solo favoritos o no, se vuelve a ejecutar la función
  );

  // useEffect para cargar las actividades cuando cambia el usuario, los filtros o la función fetchActividades
  useEffect(() => {
    if (usuarioId) {
      setOffset(0);
      fetchActividades(0, categoriasSeleccionadas, fechaSeleccionada);
    }
  }, [usuarioId, categoriasSeleccionadas, fechaSeleccionada, fetchActividades]);

  // Función para manejar el botón "Ver más", incrementa el offset y llama a fetchActividades con el nuevo offset
  const handleVerMas = () => {
    const nuevoOffset = offset + limit;
    setOffset(nuevoOffset);
    fetchActividades(nuevoOffset, categoriasSeleccionadas, fechaSeleccionada);
  };

  const toggleLike = (actividadId: string) => {
    // Guardar estado anterior en caso de necesitar revertir
    const isFav = favoritos.includes(actividadId);
    const estadoAnterior = favoritos;
    const likesAnteriores = likesPorActividad;

    // Actualizar estado INMEDIATAMENTE (optimistic update)
    setFavoritos((prev) =>
      prev.includes(actividadId)
        ? prev.filter((id) => id !== actividadId)
        : [...prev, actividadId]
    );

    // Actualizar contador de likes
    setLikesPorActividad((prev) => ({
      ...prev,
      [actividadId]: isFav ? (prev[actividadId] || 0) - 1 : (prev[actividadId] || 0) + 1,
    }));

    // Mostrar toast inmediatamente
    toast.success(isFav ? "Removido de favoritos" : "Agregado a favoritos");

    if (mostrarSoloFavoritos) {
      setActividades((prev) => prev.filter((a) => a.id !== actividadId)); // Si se está mostrando solo favoritos y se quita un favorito, removerlo de la lista de actividades
    }

    // Hacer el fetch en background (sin await)
    fetch(`/api/comunidad/actividades/${actividadId}/like`, { method: "POST" })
      .catch((err) => {
        console.error("Error al dar like:", err);
        // Revertir cambios si hay error
        setFavoritos(estadoAnterior);
        setLikesPorActividad(likesAnteriores);
        toast.error("Error al actualizar favorito");
      });
  };

  // Función para expandir o colapsar la descripción de una actividad
  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Función para abrir el modal de imágenes, estableciendo las imágenes y el índice actual
  const toggleModal = (imagenes: Archivo[], index: number) => {
    setImagenes(imagenes);
    setCurrentIndex(index);
    setModalOpen(true);
  };

  // Efecto para mostrar u ocultar el botón de scroll to top
  useEffect(() => {
    const handleScroll = () => setShowScrollButton(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Función para hacer scroll suave hacia arriba
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // Renderizado condicional según el estado de carga, error o ausencia de actividades
  if (loadingInicial)
    return <SkeletonActividadesUsuario />;

  if (error)
    return <div className="text-red-600 text-center font-medium mt-10">{error}</div>;

  if (actividades.length === 0)
    return <div className="text-center text-gray-600 mt-10">No hay actividades para mostrar.</div>;

  if (!user)
    return (
      <div className="text-center text-gray-600 mt-10">
        Debes iniciar sesión para ver las actividades.
      </div>
    );

  return (
    <div className="w-full flex flex-col items-center py-6 px-4 md:px-0">
      <h2 className="text-3xl font-bold mb-8 text-[#003c71] text-center">
        {mostrarSoloFavoritos ? "Favoritos" : "Actividades del usuario"}
      </h2>

      {/* Filtros */}
      <div className="w-full max-w-2xl mb-6 flex flex-col gap-4">
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <span className="text-sm font-semibold text-gray-600">Filtrar por:</span>
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <div className="w-full sm:w-48">
              <FiltroCategoria
                categoriasSeleccionadas={categoriasSeleccionadas}
                onChange={setCategoriasSeleccionadas}
              />
            </div>
            <div className="w-full sm:w-40">
              <FiltroFecha
                fechaSeleccionada={fechaSeleccionada}
                onChange={setFechaSeleccionada} // onChange significa que cuando el filtro de fecha cambie, se actualizará el estado fechaSeleccionada
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl mx-auto">
        {actividades.map((act) => {
          const imagenesAct = act.actividad_archivos.filter((a) => a.tipo.startsWith("image/"));
          const otrosArchivos = act.actividad_archivos.filter((a) => !a.tipo.startsWith("image/"));
          const categorias = act.actividad_categoria?.map((c) => c.categoria.nombre);
          const isFav = favoritos.includes(act.id);

          return (
            <div
              key={act.id}
              className="w-full bg-white rounded-2xl shadow border border-gray-200 p-5 flex flex-col justify-between"
            >
              {/* Contenido superior */}
              <div className="flex flex-col flex-1 gap-4">
                {/* Cabecera */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                      <img
                        src={perfilImagen || "/images/icons/perfil/default-avatar.svg"}
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
                      actividad={{ id: act.id, usuario_id: act.usuario_id }}
                      userId={user.id}
                      rol={user.rol}
                    />
                  </div>
                </div>

                {/* Título */}
                <h3 className="text-lg font-bold text-[#003c71] -mb-2">{act.titulo}</h3>

                {/* Descripción */}
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

                {/* Otros archivos */}
                {otrosArchivos.length > 0 && (
                  <div className="flex flex-col gap-1 mt-2">
                    {otrosArchivos.map((a, i) => (
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

                {/* Galería de imágenes */}
                {imagenesAct.length > 0 && (
                  <div className="px-4 pb-4 grid grid-cols-3 gap-2">
                    {imagenesAct.slice(0, 2).map((img, i) => (
                      <button
                        key={i}
                        onClick={() => toggleModal(imagenesAct, i)}
                        className="w-full aspect-square overflow-hidden rounded-md"
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
                        onClick={() => toggleModal(imagenesAct, 2)}
                        className="w-full aspect-square rounded-md flex items-center justify-center text-gray-700 text-2xl font-bold transition relative overflow-hidden bg-gray-200"
                      >
                        <span className="relative z-10">+{imagenesAct.length - 2}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Botones y barra de comentarios */}
              <div className="mt-4">
                <div className="flex items-center gap-4 text-gray-600 pt-3 border-t border-gray-200 text-sm">
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleLike(act.id)} className="hover:opacity-75 transition">
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
                      {likesPorActividad[act.id] ?? 0}
                    </span>
                  </div>

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
                    const count = await fetchComentariosCount(act.id);
                    actualizarComentarios(act.id, count);
                    await fetchUltimoComentario(act.id);
                  }}
                />
              </div>     

              {/* ÚLTIMO COMENTARIO */}
              {ultimoComentario[act.id] && (
                <div className="border-t border-gray-100 pt-3 mt-2">
                  <p className="text-xs text-gray-500 mb-2 font-semibold">Último comentario</p>
                  <div className="flex items-start gap-2 bg-gray-50 rounded-lg p-3">
                    {ultimoComentario[act.id].usuario?.perfil?.imagen ? (
                      <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                        <img
                          src={ultimoComentario[act.id].usuario.perfil.imagen}
                          alt={`${ultimoComentario[act.id].usuario?.nombre}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs flex-shrink-0">
                        {ultimoComentario[act.id].usuario?.nombre?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-gray-800">
                        {ultimoComentario[act.id].usuario?.nombre} {ultimoComentario[act.id].usuario?.apellido}
                      </p>
                      <p className="text-xs text-gray-700 line-clamp-2">
                        {ultimoComentario[act.id].contenido}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {hasMore && !loadingInicial && !mostrarSoloFavoritos && (
          <button
            onClick={handleVerMas}
            disabled={loadingVerMas}
            className="px-5 py-2 bg-[#003c71] text-white rounded-full hover:bg-[#00509e] transition self-center"
          >
            {loadingVerMas ? "Cargando..." : "Ver más"}
          </button>
        )}
      </div>

      {/* Modales */}
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
          actividadId={actividadParaColeccion}
        />
      )}

      {showScrollButton && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 bg-[#003c71] text-white p-3 rounded-full shadow-lg hover:bg-[#00509e] transition"
          aria-label="Subir arriba"
        >
          🡹
        </button>
      )}
    </div>
  );
}
