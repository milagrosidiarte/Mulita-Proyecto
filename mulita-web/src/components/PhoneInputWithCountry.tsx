"use client";

import React, { useState, useRef, useEffect } from "react";
import { getCountryCallingCode } from "libphonenumber-js";
import { countries } from "country-flag-icons";

interface Country {
  code: string;
  name: string;
  callingCode: string;
  flag: string;
}

const COUNTRY_LIST: Country[] = countries // Obtener la lista de países desde country-flag-icons
  .map((code) => { // Mapeamos cada código de país a un objeto Country
    try {
      const callingCode = getCountryCallingCode(code as any); // Obtenemos el código de llamada del país usando libphonenumber-js
      return { // Devolvemos un objeto Country con el código, nombre, código de llamada y bandera del país
        code,
        name: new Intl.DisplayNames(["es"], { type: "region" }).of(code) || code, // Obtenemos el nombre del país en español, si no está disponible usamos el código
        callingCode: `+${callingCode}`, // Agregamos el signo + al código de llamada
        flag: String.fromCodePoint(...[...code].map((x) => 0x1f1a5 + x.charCodeAt(0))), // Convertimos el código de país a un emoji de bandera
      };
    } catch { // Si hay un error (por ejemplo, código de país inválido), devolvemos null
      return null;
    }
  })
  .filter(Boolean) as Country[]; // Filtramos los valores nulos y aseguramos que el resultado sea un array de Country

COUNTRY_LIST.sort((a, b) => a.name.localeCompare(b.name)); // Ordenamos la lista de países alfabéticamente por nombre

// Props: informacion de entrada que un componente recibe de su padre para poder funcionar.
interface PhoneInputWithCountryProps { // Definimos las props del componente PhoneInputWithCountry
  value: string; // El valor del número de teléfono, incluyendo el código de país
  onChange: (value: string) => void; // Función que se llama cuando el valor del número de teléfono cambia
  placeholder?: string; // Placeholder opcional para el input del número de teléfono
}

export default function PhoneInputWithCountry({ // Componente que combina un selector de país y un input de teléfono
  value,
  onChange,
  placeholder = "Teléfono",
}: PhoneInputWithCountryProps) { // Desestructuramos las props recibidas
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRY_LIST.find((c) => c.code === "AR") || COUNTRY_LIST[0]); // Estado para el país seleccionado, por defecto Argentina o el primer país de la lista
  const [isOpen, setIsOpen] = useState(false); // Estado para controlar si el dropdown de países está abierto o cerrado
  const [searchTerm, setSearchTerm] = useState(""); // Estado para el término de búsqueda en el dropdown de países
  const dropdownRef = useRef<HTMLDivElement>(null); // Referencia al contenedor del dropdown para detectar clics fuera del menú

  const filteredCountries = COUNTRY_LIST.filter((country) => // Filtramos la lista de países según el término de búsqueda
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) || // Buscamos por nombre del país
    country.callingCode.includes(searchTerm) // Buscamos por código de llamada
  );

  useEffect(() => { // Efecto que se ejecuta cuando el componente se monta y cuando cambia el estado del dropdown
    const handleClickOutside = (event: MouseEvent) => { // 
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) { //dropdownRef.current es el contenedor del dropdown
        setIsOpen(false); // Cerramos el dropdown si se hace clic fuera de él
      }
    };

    document.addEventListener("mousedown", handleClickOutside); // Agregamos un listener para detectar clics fuera del dropdown
    return () => document.removeEventListener("mousedown", handleClickOutside); // Limpiamos el listener cuando el componente se desmonta
  }, []);

  const handleSelectCountry = (country: Country) => { // Función que se llama cuando se selecciona un país del dropdown
    setSelectedCountry(country); // Actualizamos el estado del país seleccionado
    setIsOpen(false); // Cerramos el dropdown
    setSearchTerm(""); // Limpiamos el término de búsqueda
    onChange(country.callingCode); // Llamamos a la función onChange pasada como prop para actualizar el valor del teléfono
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => { // Función que se llama cuando cambia el valor del input de teléfono
    let input = e.target.value; // Obtenemos el valor del input
    const callingCode = selectedCountry.callingCode; // Obtenemos el código de llamada del país seleccionado

    // Solo permitimos dígitos, espacios, guiones y paréntesis en el input
    input = input.replace(/[^\d\s\-()]/g, "");

    // Obtener solo los dígitos del código de llamada (sin el signo +)
    const callingCodeDigits = callingCode.replace("+", "");

    // Si el input es vacío o más corto que el código de llamada, simplemente establecemos el valor como el código de llamada
    if (!input || input.length < callingCodeDigits.length) {
      onChange(callingCode);
      return;
    }

    // Si comienza con el código de llamada, lo dejamos tal cual y agregamos el resto del input
    if (input.startsWith(callingCodeDigits)) {
      onChange(callingCode + input.substring(callingCodeDigits.length));
      return;
    }

    // Si no comienza con el código de llamada, lo agregamos al principio del input
    onChange(callingCode + input);
  };

  return (
    <div className="flex gap-2 w-full">
      {/* Country Selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="shadow-[0_4px_4px_rgba(0,0,0,0.25)] rounded-lg border border-gray-300 h-10 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600 flex items-center gap-2 bg-white hover:bg-gray-50 transition-colors"
        >
          <span className="text-xl">{selectedCountry.flag}</span>
          <span className="text-sm font-medium">{selectedCountry.callingCode}</span>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
            {/* Search Input */}
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                placeholder="Buscar país..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Country List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleSelectCountry(country)}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-blue-50 transition-colors text-left"
                >
                  <span className="text-xl">{country.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{country.name}</div>
                    <div className="text-xs text-gray-500">{country.callingCode}</div>
                  </div>
                  {selectedCountry.code === country.code && (
                    <span className="text-blue-600 font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Phone Number Input */}
      <input
        type="tel"
        placeholder={placeholder}
        value={value}
        onChange={handlePhoneChange}
        className="flex-1 shadow-[0_4px_4px_rgba(0,0,0,0.25)] rounded-lg border border-gray-300 h-10 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600"
      />
    </div>
  );
}
