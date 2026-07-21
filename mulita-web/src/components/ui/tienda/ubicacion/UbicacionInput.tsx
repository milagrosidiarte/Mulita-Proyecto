"use client";

import { useState, useEffect } from "react";

// Componente de input para buscar ubicaciones usando la API de Geoapify
export type Lugar = {
  display_name: string;
  lat: string;
  lon: string;
};

// El componente recibe un valor inicial (texto) y una función onSelect que se 
// llama cuando el usuario selecciona un lugar de los resultados
export default function UbicacionInput({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (lugar: Lugar) => void;
}) { 
  const [query, setQuery] = useState(value); // Estado para el texto del input
  const [resultados, setResultados] = useState<Lugar[]>([]); // Estado para los resultados de la búsqueda
  const [loading, setLoading] = useState(false); // Estado para indicar si se está cargando la búsqueda

  // Flag para evitar que el useEffect vuelva a buscar al seleccionar
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    if (isSelecting) return; // si el usuario está seleccionando un lugar, no hago la búsqueda

    if (query.length < 3) { // si el texto es muy corto, no hago la búsqueda
      setResultados([]);
      return;
    }

    // Uso un timer para hacer la búsqueda 400ms después de que el usuario deje de tipear
    const timer = setTimeout(async () => {
      setLoading(true);

      // Hago la llamada a la API de Geoapify para buscar lugares que coincidan con el texto del input
      const res = await fetch(
        `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
          query
        )}&limit=5&lang=es&filter=countrycode:ar&apiKey=${
          process.env.NEXT_PUBLIC_GEOAPIFY_KEY
        }`
      );

      const data = await res.json();

      // Mapeo los resultados de la API a un array de objetos Lugar
      const lugares: Lugar[] = data.features.map((f: any) => ({
        display_name: f.properties.formatted,
        lat: String(f.properties.lat),
        lon: String(f.properties.lon),
      }));

      // Actualizo el estado con los resultados de la búsqueda y desactivo el loading
      setResultados(lugares);
      setLoading(false);
    }, 400);

    // Limpio el timer si el componente se desmonta o si query cambia antes de que pasen los 400ms
    return () => clearTimeout(timer);
  }, [query, isSelecting]);

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Buscar ubicación..."
        value={query}
        onChange={(e) => {
          setIsSelecting(false); // si el usuario vuelve a tipear, vuelvo al modo "buscar"
          setQuery(e.target.value);
        }}
        className="w-full border px-3 py-2 rounded-md"
      />

      {loading && (
        <div className="absolute right-3 top-3">
          <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {resultados.length > 0 && (
        <div className="absolute bg-white border rounded-md shadow-lg z-50 w-full max-h-60 overflow-auto">
          {resultados.map((lugar, index) => (
            <button
              key={index}
              className="text-left w-full px-3 py-2 hover:bg-gray-100"
              onClick={() => {
                setIsSelecting(true); // indico que el usuario está seleccionando un lugar, para evitar que se haga otra búsqueda
                setQuery(lugar.display_name); // actualizo el input con el nombre del lugar seleccionado
                setResultados([]); // limpio los resultados de la búsqueda
                onSelect(lugar); // llamo a la función onSelect con el lugar seleccionado
              }}
            >
              {lugar.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
