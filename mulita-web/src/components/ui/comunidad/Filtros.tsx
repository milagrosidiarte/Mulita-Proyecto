"use client";

import { useEffect, useRef, useState, memo, useCallback } from "react";

// Filtros.tsx es un componente que contiene filtros para la sección de comunidad. 
// Permite filtrar actividades por categorías y por fecha.
interface Categoria {
  id: string;
  nombre: string;
  tipo?: "curso" | "dificultad" | "materia"; // Tipo de categoría, puede ser curso, dificultad o materia
}


interface FiltroCategoriaProps {
  categoriasSeleccionadas: string[];
  onChange: (categorias: string[]) => void;
}
// FiltroFechaProps define las propiedades del filtro de fecha.
interface FiltroFechaProps {
  fechaSeleccionada: string; // Fecha seleccionada
  onChange: (fecha: string) => void; // Función para manejar el cambio de fecha
}

// FiltroCategoriaComponent es un componente que muestra un dropdown para seleccionar categorías.
function FiltroCategoriaComponent({ categoriasSeleccionadas, onChange }: FiltroCategoriaProps) { // Recibimos las categorías seleccionadas y la función para manejar cambios
  const [categorias, setCategorias] = useState<Categoria[]>([]);  // Estado para almacenar las categorías obtenidas desde la API
  const [isOpen, setIsOpen] = useState(false); // Estado para controlar si el dropdown está abierto o cerrado
  const [localSeleccionadas, setLocalSeleccionadas] = useState<string[]>(categoriasSeleccionadas); // Estado local para manejar las categorías seleccionadas dentro del componente antes de notificar al parent
  const dropdownRef = useRef<HTMLDivElement>(null); // Referencia al contenedor del dropdown para detectar clics fuera de él

  // Sincronizar estado local con props cuando se reciben del parent
  useEffect(() => {
    setLocalSeleccionadas(categoriasSeleccionadas); // Actualizamos el estado local cuando las props cambian, para mantener la consistencia entre el parent y el componente
  }, [categoriasSeleccionadas]); 

  // Obtener categorías desde la API al montar el componente
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await fetch("/api/categorias");
        if (!res.ok) throw new Error("Error al obtener categorías");
        const data = await res.json();
        setCategorias(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategorias(); 
  }, []);

  // Cerrar dropdown solo cuando hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Notificar al parent cuando se cierra el dropdown
        onChange(localSeleccionadas);
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, localSeleccionadas, onChange]); // Dependencias: se ejecuta cuando cambia el estado de apertura del dropdown, las categorías seleccionadas o la función onChange

  // Manejar tecla Enter para cerrar dropdown y cargar filtros
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && isOpen) {
        event.preventDefault(); // Prevenir el comportamiento por defecto de Enter 
        onChange(localSeleccionadas); // Notificar al parent con las categorías seleccionadas
        setIsOpen(false); // Cerrar el dropdown
      }
    };

    // Agregar y remover el listener de teclado solo cuando el dropdown está abierto
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, localSeleccionadas, onChange]);

  // Manejar cambios en la selección de categorías
  const handleCategoriaChange = useCallback((nombre: string) => {
    setLocalSeleccionadas(prev => { // Actualizamos el estado local de categorías seleccionadas
      if (prev.includes(nombre)) { 
        return prev.filter((c) => c !== nombre); // Si ya estaba seleccionada, la removemos
      } else {
        return [...prev, nombre]; // Si no estaba seleccionada, la agregamos
      }
    });
  }, []);

  // Manejar clic en el checkbox de una categoría sin cerrar el dropdown
  const handleCheckboxClick = useCallback((e: React.ChangeEvent<HTMLInputElement>, nombre: string) => { 
    e.stopPropagation();
    handleCategoriaChange(nombre); // Actualizamos la selección de categorías sin cerrar el dropdown
  }, [handleCategoriaChange]);

  // Manejar clic en el botón de abrir/cerrar el dropdown
  const handleButtonClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsOpen(prev => !prev); // Alternamos el estado de apertura del dropdown
  }, []);

  // Manejar clic en el botón de limpiar filtros
  const handleLimpiarClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); 
    setLocalSeleccionadas([]);
    onChange([]);
  }, [onChange]);

  // Filtrar categorías por tipo para mostrarlas en secciones separadas
  const cursos = categorias.filter((c) => c.tipo === "curso");
  const materias = categorias.filter((c) => c.tipo === "materia");
  const dificultades = categorias.filter((c) => c.tipo === "dificultad");

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        onClick={handleButtonClick}
        className="w-full border-2 border-gray-200 rounded-full px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#003c71] bg-white text-left flex justify-between items-center pointer-events-auto hover:border-[#003c71] transition-colors"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          {localSeleccionadas.length === 0 // Si no hay categorías seleccionadas, mostramos "Categorías", de lo contrario mostramos la cantidad de categorías seleccionadas
            ? "Categorías"
            : `${localSeleccionadas.length} seleccionada${localSeleccionadas.length > 1 ? "s" : ""}`}
        </span>
        <svg className="w-4 h-4 text-[#003c71]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M19 14l-7-7m0 0L5 14m7-7v12" : "M5 10l7 7 7-7"} />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-200 rounded-2xl shadow-xl z-50 max-h-96 overflow-y-auto">
          {/* Cursos */}
          {cursos.length > 0 && (
            <div className="border-b border-gray-200">
              <div className="bg-blue-50 px-4 py-3 border-l-4 border-blue-500">
                <h3 className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                  <span className="text-lg">📚</span>
                  Cursos
                </h3>
              </div>
              <div className="px-4 py-3 space-y-3">
                {cursos.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={localSeleccionadas.includes(cat.nombre)}
                      onChange={(e) => handleCheckboxClick(e, cat.nombre)}
                      className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 font-medium">{cat.nombre}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Materias */}
          {materias.length > 0 && (
            <div className="border-b border-gray-200">
              <div className="bg-green-50 px-4 py-3 border-l-4 border-green-500">
                <h3 className="text-sm font-semibold text-green-700 flex items-center gap-2">
                  <span className="text-lg">📖</span>
                  Materias
                </h3>
              </div>
              <div className="px-4 py-3 space-y-3">
                {materias.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={localSeleccionadas.includes(cat.nombre)}
                      onChange={(e) => handleCheckboxClick(e, cat.nombre)}
                      className="w-4 h-4 accent-green-600 rounded cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 font-medium">{cat.nombre}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Dificultades */}
          {dificultades.length > 0 && (
            <div>
              <div className="bg-orange-50 px-4 py-3 border-l-4 border-orange-500">
                <h3 className="text-sm font-semibold text-orange-700 flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  Dificultades
                </h3>
              </div>
              <div className="px-4 py-3 space-y-3">
                {dificultades.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={localSeleccionadas.includes(cat.nombre)}
                      onChange={(e) => handleCheckboxClick(e, cat.nombre)}
                      className="w-4 h-4 accent-orange-600 rounded cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 font-medium">{cat.nombre}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Botón limpiar */}
          {localSeleccionadas.length > 0 && (
            <div className="border-t border-gray-200 p-3 bg-gray-50">
              <button
                onClick={handleLimpiarClick}
                className="w-full text-sm font-medium bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-full transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Memoizamos el componente FiltroCategoria para evitar renders innecesarios cuando las props no cambian
export const FiltroCategoria = memo(FiltroCategoriaComponent);

// FiltroFecha es un componente que muestra un dropdown para seleccionar un filtro de fecha.
export function FiltroFecha({ fechaSeleccionada, onChange }: FiltroFechaProps) {
  const [isOpen, setIsOpen] = useState(false);
  const opciones = [
    { label: "Hoy", value: "hoy" },
    { label: "Esta semana", value: "semana" },
    { label: "Este mes", value: "mes" },
    { label: "De más nuevo a más antiguo", value: "nuevo_antiguo" },
    { label: "De más antiguo a más nuevo", value: "antiguo_nuevo" },
  ];

  // Manejar cambio de selección de fecha
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="w-full flex relative">
      <select
        aria-label="Filtrar por fecha"
        value={fechaSeleccionada}
        onChange={handleChange}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        className="w-full border-2 border-gray-200 rounded-full px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#003c71] bg-white hover:border-[#003c71] transition-colors appearance-none pr-10"
      >
        <option value="">📅 Fecha</option>
        {opciones.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>
      <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#003c71] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M19 14l-7-7m0 0L5 14m7-7v12" : "M5 10l7 7 7-7"} />
      </svg>
    </div>
  );
}
