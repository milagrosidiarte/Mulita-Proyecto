"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/hooks/queries";
import { useQueryClient } from "@tanstack/react-query";
import { createClientSupabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import Link from "next/link";

// Componente de inicio de sesión
export default function Login() {
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useUser(); // no se usa porque el queryClient.invalidateQueries se encarga de revalidar el query de usuario
  const queryClient = useQueryClient(); // Para invalidar el query de usuario después de iniciar sesión

  // Función para manejar el clic en el botón "Continuar"
  const onContinuarClick = async () => {
    setLoading(true);

    try {
      // 1. Autenticar con Supabase SDK en el frontend
      const supabase = createClientSupabase(); // Crear cliente Supabase en el frontend porque no se puede usar el cliente del backend directamente
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ // Autenticación con email y contraseña
        email,
        password: contrasena,
      });

      if (authError) {
        // Traducir mensajes comunes de Supabase
        let mensaje = authError.message;
        if (mensaje.includes("Invalid login credentials")) {
          mensaje = "Email o contraseña incorrectos";
        } else if (mensaje.includes("Email not confirmed")) {
          mensaje = "Debes confirmar tu email antes de iniciar sesión";
        }
        toast.error(mensaje);
        setLoading(false);
        return;
      }

      // Validar que se obtuvieron los datos de usuario y sesión
      if (!authData.user || !authData.session) {
        toast.error("No se pudo obtener la sesión");
        setLoading(false);
        return;
      }

      // 2. Enviar tokens al backend para validar y crear cookies
      const res = await fetch("/api/auth/validate-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: authData.session.access_token,
          refresh_token: authData.session.refresh_token,
        }),
        credentials: "include",
      });

      // Validar la respuesta del backend
      const data = await res.json();

      // Si la respuesta no es ok o no tiene éxito, mostrar un error
      if (!res.ok || !data.success) {
        toast.error(data.message || "Error al validar la sesión");
        setLoading(false);
        return;
      }

      // 3. Invalidar el query de usuario para que se revalide
      queryClient.invalidateQueries({ queryKey: ["user"] }); // Esto hará que useUser() se revalide y obtenga los datos del usuario recién autenticado
      
      // 4. Redirigimos al inicio
      toast.success("¡Sesión iniciada correctamente!");
      router.push("/");
    } catch (err) {
      console.error(err);
      toast.error("Error en el servidor");
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar la tecla Enter en los inputs
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && email && contrasena && !loading) {
      onContinuarClick();
    }
  };

  const inputClass =
    "w-full shadow-[0_4px_4px_rgba(0,0,0,0.25)] rounded-lg border border-gray-300 h-10 px-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-600";

  const buttonClass =
    "w-full bg-[#003c71] text-white rounded-lg h-10 flex items-center justify-center cursor-pointer hover:bg-blue-800";

  return (
    <div className="w-full bg-white flex flex-col items-center justify-start font-Inter text-base text-black pt-24 pb-6">
      <div className="w-96 flex flex-col items-center justify-start gap-6">
        <div className="flex flex-col items-center gap-1 text-center text-black">
          <h1 className="text-2xl font-semibold leading-[150%] tracking-tight">
            Iniciar Sesión
          </h1>
          <p className="text-base text-[#003c71] leading-[150%]">
            Introduce tu email y contraseña
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full text-[#003c71]">
          <label className="inline-block w-52 font-bold">Correo electrónico</label>
          <input
            type="email"
            placeholder="usuario@mulita.com"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={handleKeyPress}
          />

          <label className="inline-block w-full font-bold mt-2">Contraseña</label>
          <input
            type="password"
            placeholder="contraseña"
            className={inputClass}
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>

        <div className="w-full">
          <button
            type="button"
            className={buttonClass}
            onClick={onContinuarClick}
            disabled={!email || !contrasena || loading}
          >
            <span className="font-medium text-white leading-[150%]">
              {loading ? "Iniciando sesión..." : "Continuar"}
            </span>
          </button>
        </div>

        <div className="text-center">
          <Link
            href="/auth/reset-password"
            className="text-sm text-[#003c71] font-semibold hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            ¿No tienes cuenta?{" "}
            <Link
              href="/auth/register"
              className="text-[#003c71] font-semibold hover:underline"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
