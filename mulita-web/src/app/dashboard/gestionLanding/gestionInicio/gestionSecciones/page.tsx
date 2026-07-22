"use client";

import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

// Definimos la interfaz para una sección, que incluye su id, nombre y orden
interface Seccion {
  id: number;
  nombre: string;
  orden: number;
}

// Definimos la función para la página de gestión de secciones, 
// que incluye la lista de secciones y la funcionalidad para arrastrar y soltar para cambiar el orden
export default function GestionSeccionesPage() {
  const [secciones, setSecciones] = useState<Seccion[]>([]); 

  // Cargar secciones desde la API al montar el componente
  useEffect(() => {
    fetchSecciones();
  }, []);

  // Función para traer las secciones desde la API y actualizar el estado
  async function fetchSecciones() {
    const res = await fetch("/api/inicio/secciones");
    const data = await res.json();
    setSecciones(data.secciones);
  }

  // Guardar nuevo orden en la base de datos
  async function actualizarOrden(seccionesActualizadas: Seccion[]) { // Actualizar el orden de las secciones en la base de datos
    for (let i = 0; i < seccionesActualizadas.length; i++) { // Iterar sobre las secciones actualizadas
      const sec = seccionesActualizadas[i]; //  Obtener la sección actual
      await fetch(`/api/inicio/secciones/${sec.id}`, { // Hacer un PATCH a la API para actualizar el orden de la sección
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orden: i + 1 }) // Enviar el nuevo orden (i + 1) al backend
      });
    }
    fetchSecciones();
  }

  // Manejar el evento de arrastrar y soltar para reordenar las secciones
  function handleDragEnd(result: DropResult) { 
    if (!result.destination) return; // Si no hay destino, no hacer nada

    const items = Array.from(secciones); // Crear una copia del array de secciones
    const [reordenado] = items.splice(result.source.index, 1); // Remover la sección arrastrada del array
    items.splice(result.destination.index, 0, reordenado); // Insertar la sección arrastrada en la nueva posición

    setSecciones(items); // Actualizar el estado con el nuevo orden de secciones
    actualizarOrden(items); // Llamar a la función para actualizar el orden en la base de datos
  }

  return (
    <div className="w-full min-h-screen relative overflow-hidden flex flex-col items-center px-4 sm:px-6 pb-10 box-border font-inter">
      {/* Header */}
      <div className="w-full max-w-[1103px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
        <div className="flex flex-col text-[28px] sm:text-[32px] md:text-[36px]">
          <h1 className="leading-tight font-extrabold text-black">
            Gestión de Secciones
          </h1>
          <p className="mt-2 text-left text-sm sm:text-base leading-6 text-[#6d758f]">
            Arrastra y organiza el orden de las secciones de la página de inicio.
          </p>
        </div>
      </div>

      {/* Lista de secciones */}
      <div className="flex-1 w-full max-w-[1103px] mt-10 flex flex-col gap-4">
        <DragDropContext onDragEnd={handleDragEnd}> 
          <Droppable droppableId="secciones">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="flex flex-col gap-4"
              >
                {secciones.map((sec, index) => (
                  <Draggable key={sec.id} draggableId={sec.id.toString()} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6 bg-white border border-[#e1e4ed] rounded-lg shadow-sm transition ${
                          snapshot.isDragging ? "shadow-md bg-blue-50" : "hover:shadow-md"
                        }`}
                      >
                        <div className="text-base sm:text-lg font-semibold text-black break-words">
                          {sec.nombre}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}
