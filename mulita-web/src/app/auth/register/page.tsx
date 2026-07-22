"use client";

import React, { useState, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";
import PhoneInputWithCountry from "@/components/PhoneInputWithCountry";
import { Country, State, City, IState, ICity } from "country-state-city";
import Select from "react-select";

// Componente de la página de registro de usuario
export default function RegisterPage() {
  const [esDocente, setEsDocente] = useState(false); // Estado para determinar si el usuario es docente o no
  const [loading, setLoading] = useState(false); 
  const [telefono, setTelefono] = useState(""); // Estado para almacenar el número de teléfono ingresado por el usuario

  const [selectedCountry, setSelectedCountry] = useState<string>(""); // Estado para almacenar el país seleccionado por el usuario
  const [selectedState, setSelectedState] = useState<string>(""); // Estado para almacenar la provincia/estado seleccionado por el usuario
  const [ListaProvincias, setListaProvincias] = useState<IState[]>([]); // Estado para almacenar la lista de provincias/estados del país seleccionado
  const [ListaCiudades, setListaCiudades] = useState<ICity[]>([]); // Estado para almacenar la lista de ciudades del país y provincia/estado seleccionado

  const formRef = useRef<HTMLFormElement>(null); // Referencia al formulario para poder resetearlo después de un registro exitoso

  // Manejar el evento de presionar la tecla Enter para enviar el formulario
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !loading) {
      formRef.current?.requestSubmit();
    }
  }
  const countryList = Country.getAllCountries(); // Obtener la lista de todos los países utilizando la librería country-state-city

  // Crear un array de opciones para el componente Select a partir de la lista de países
  const countryOptions = countryList.map((c) => ({
    value: c.isoCode,
    label: c.name,
  }));

  // Manejar el cambio de país seleccionado
  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const isoCode = e.target.value; // Obtener el código ISO del país seleccionado
    const country = countryList.find(c => c.isoCode === isoCode); // Buscar el país seleccionado en la lista de países

    if (!country) return; // Si no se encuentra el país, salir de la función
    setSelectedCountry(isoCode); // Actualizar el estado del país seleccionado

    // Cargar provincias/estados del país
    const states = State.getStatesOfCountry(isoCode);
    setListaProvincias(states);
  };

  // Manejar el cambio de provincia
  const handleStateChange = (stateName: string) => {
    setSelectedState(stateName);
    const country = countryList.find(c => c.name === selectedCountry);
    if (!country) return;

    // Obtener todas las ciudades del país y estado seleccionado
    const cities = City.getCitiesOfState(country.isoCode, stateName);
    setListaCiudades(cities);
  };

  // Función para manejar el envío del formulario de registro
  const onContinuarClick = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const rol: "usuario" | "docente" = esDocente ? "docente" : "usuario"; // Determinar el rol del usuario según si es docente o no, el ? significa "si esDocente es true, entonces rol es 'docente', de lo contrario es 'usuario'"

    // Obtener los datos del formulario utilizando FormData
    const formData = new FormData(e.currentTarget);
    const nombre = formData.get("nombre")?.toString() ?? ""; // Obtener el nombre del usuario desde el formulario, si no existe, asignar una cadena vacía
    const apellido = formData.get("apellido")?.toString() ?? "";
    const email = formData.get("email")?.toString() ?? "";
    const contrasena = formData.get("contrasena")?.toString() ?? "";
    
    // Validar nombre - no debe contener números
    if (/\d/.test(nombre)) {
      toast.error("El nombre no puede contener números");
      setLoading(false);
      return;
    }

    // Validar apellido - no debe contener números
    if (/\d/.test(apellido)) {
      toast.error("El apellido no puede contener números");
      setLoading(false);
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("El email no es válido");
      setLoading(false);
      return;
    }

    // Validar teléfono - debe tener mínimo 7 y máximo 30 dígitos
    const phoneDigits = telefono.replace(/\D/g, "");
    if (phoneDigits.length < 7) {
      toast.error("El teléfono es muy corto");
      setLoading(false);
      return;
    }
    if (phoneDigits.length > 30) {
      toast.error("El teléfono no puede tener más de 30 dígitos");
      setLoading(false);
      return;
    }

    // Validar contraseña - debe tener mínimo 6 caracteres
    if (contrasena.length < 6) {
      toast.error("La contraseña es muy corta");
      setLoading(false);
      return;
    }

    // Crear un objeto con los datos del usuario para enviar al backend
    const data = {
      nombre,
      apellido,
      email,
      telefono,
      contrasena,
      rol,
      institucion: formData.get("institucion")?.toString() ?? "",
      pais: formData.get("pais")?.toString() ?? "",
      provincia: formData.get("provincia")?.toString() ?? "",
      ciudad: formData.get("ciudad")?.toString() ?? "",
    };

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await res.json();

      if (!result.success) throw new Error(result.message || "Error al registrar usuario");

      toast.success("Usuario registrado. Revisa tu email para confirmar tu cuenta.");

      formRef.current?.reset(); // Resetear el formulario después de un registro exitoso
      setEsDocente(false); // Resetear el estado de esDocente a false
      setTelefono(""); // Resetear el estado del teléfono a una cadena vacía
    } catch (err: any) {
      console.error(err);
      
      // Manejo específico de errores
      if (err.message && err.message.includes("rate limit")) {
        toast.error("Demasiados intentos. Por favor espera algunos minutos antes de intentar nuevamente.");
      } else if (err.message && err.message.includes("email")) {
        toast.error("El email ya está registrado o hay un problema con el registro. Intenta con otro email.");
      } else {
        toast.error("Error al registrar usuario: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [esDocente, telefono]); // Dependencias del useCallback: esDocente y telefono, para que la función se actualice si estos cambian

  // Clases CSS para los inputs y botones del formulario
  const inputClass =
    "w-full shadow-[0_4px_4px_rgba(0,0,0,0.25)] rounded-lg border border-gray-300 h-10 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600";

  const buttonClass =
    "w-full bg-[#003c71] text-white rounded-lg h-10 flex items-center justify-center cursor-pointer hover:bg-blue-800";

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-white p-4">
      <form
        ref={formRef}
        className="w-full max-w-md flex flex-col gap-6"
        onSubmit={onContinuarClick}
      >
        {/* Títulos */}
        <div className="flex flex-col items-center gap-1 text-center text-black">
          <h1 className="text-2xl font-semibold">Crea una cuenta</h1>
          <p className="text-base text-[#003c71]">Introduce tus datos</p>
        </div>

        {/* Formulario */}
        <div className="flex flex-col gap-4 text-left text-lg">
          <input name="nombre" type="text" placeholder="Nombre" className={inputClass} onKeyPress={handleKeyPress} required />
          <input name="apellido" type="text" placeholder="Apellido" className={inputClass} onKeyPress={handleKeyPress} required />
          <input name="email" type="email" placeholder="Email" className={inputClass} onKeyPress={handleKeyPress} required />
          <PhoneInputWithCountry
            value={telefono}
            onChange={(value) => setTelefono(value)}
            placeholder="Teléfono"
          />
          <input name="contrasena" type="password" placeholder="Contraseña" className={inputClass} onKeyPress={handleKeyPress} required />

          <label className="flex items-center gap-2">
            <span>Docente:</span>
            <input
              type="checkbox"
              name="docente"
              className="w-5 h-5 cursor-pointer"
              checked={esDocente}
              onChange={() => setEsDocente(!esDocente)}
            />
          </label>

          {esDocente && (
            <>
              {/* Seleccionar país */}
              <Select
                options={countryOptions}
                value={countryOptions.find((o) => o.value === selectedCountry)}
                onChange={(option: any) => handleCountryChange({ target: { value: option.value } } as any)}
                placeholder="País"
              />

              {/* Seleccionar provincia según país */}
              {ListaProvincias.length > 0 ? (
                <Select
                  options={ListaProvincias.map(p => ({ value: p.name, label: p.name }))} // Crear opciones para el Select a partir de la lista de provincias
                  onChange={(option: any) => handleStateChange(option.value)}
                  value={selectedState ? { value: selectedState, label: selectedState } : null} // Establecer el valor seleccionado en el Select según el estado seleccionado
                  placeholder="Provincia"
                />
              ) : (
                <input
                  name="provincia"
                  type="text"
                  placeholder="Provincia"
                  className={inputClass}
                  onKeyPress={handleKeyPress}
                  required
                />
              )}

              {/* Seleccionar ciudad según provincia */}
              {ListaCiudades.length > 0 ? (
                <Select
                  options={ListaCiudades.map(c => ({ value: c.name, label: c.name }))}
                  onChange={(option: any) => {
                    // Guardamos la ciudad en un hidden input para FormData
                    const hiddenInput = document.querySelector<HTMLInputElement>('input[name="ciudad"]');
                    if (hiddenInput) hiddenInput.value = option.value;
                  }}
                  placeholder="Selecciona una ciudad"
                />
              ) : (
                <input name="ciudad" type="text" placeholder="Ciudad" className={inputClass} onKeyPress={handleKeyPress} required/>
              )}

              <input name="institucion" type="text" placeholder="Institución" className={inputClass} onKeyPress={handleKeyPress} required />

              {/* Hidden inputs para FormData */}
              <input type="hidden" name="pais" value={selectedCountry} />
              <input type="hidden" name="provincia" value={selectedState} />
            </>
          )}

          <button type="submit" className={buttonClass} disabled={loading}>
            {loading ? "Enviando..." : "Continuar"}
          </button>
        </div>

        <p className="text-sm">
          Al hacer clic en continuar, acepta nuestros{" "}
          <span className="text-black font-semibold">Términos de servicio y Política de privacidad</span>.
        </p>
      </form>
    </div>
  );
}
