"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ConfirmStatus = "loading" | "success" | "error"; // Estado de la confirmación del usuario

// Componente de confirmación de cuenta
export default function ConfirmPage() {
  const [status, setStatus] = useState<ConfirmStatus>("loading"); // Estado inicial de la confirmación
  const [message, setMessage] = useState("Verificando tu cuenta..."); // Mensaje inicial de verificación
  const [redirecting, setRedirecting] = useState(false); // Estado para manejar la redirección después de la confirmación
  const router = useRouter();

  useEffect(() => {
    const confirmUser = async () => {
      try {
        // Revisamos si el usuario está logueado (confirmó el email)
        const { data: { session }, error } = await supabase.auth.getSession(); // Obtenemos la sesión actual del usuario

        if (error) throw error;

        // Si no hay sesión o no hay usuario, mostramos un error
        if (!session?.user) {
          setStatus("error");
          setMessage("No se pudo verificar tu cuenta. Por favor, intenta iniciar sesión después de confirmar el email.");
          return;
        }

        // Recuperamos los datos guardados en localStorage
        const pending = localStorage.getItem("pendingUser");
        if (!pending) {
          setStatus("error");
          setMessage("No hay datos pendientes de registro.");
          return;
        }

        // Parseamos los datos del usuario pendiente
        const userData = JSON.parse(pending);

        // Insertamos en la tabla usuario
        const { error: dbError } = await supabase
          .from("usuario")
          .insert({
            id: session.user.id,
            nombre: userData.nombre,
            apellido: userData.apellido,
            email: userData.email,
            telefono: userData.telefono,
            rol: userData.rol,
          });

        if (dbError) throw dbError;

        // Si es docente, insertamos en tabla docentes
        if (userData.rol === "docente") {
          const { error: docenteError } = await supabase
            .from("docentes")
            .insert({
              usuario_id: session.user.id,
              institucion: userData.institucion,
              pais: userData.pais,
              provincia: userData.provincia,
              ciudad: userData.ciudad,
            });
          if (docenteError) throw docenteError;
        }

        // Limpiamos localStorage
        localStorage.removeItem("pendingUser");

        setStatus("success");
        setMessage("¡Tu correo ha sido verificado con éxito!");
        
        // Redirigir después de 3 segundos
        setTimeout(() => {
          setRedirecting(true);
          router.push("/auth/login");
        }, 3000);

      } catch (err: any) {
        console.error(err);
        setStatus("error");
        setMessage("Ocurrió un error al completar el registro: " + err.message);
      }
    };

    confirmUser(); // Llamamos a la función de confirmación al montar el componente
  }, [router]);

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="w-full max-w-md">
        {status === "loading" && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <h1 className="text-2xl font-semibold mb-2 text-gray-900">Verificando tu cuenta...</h1>
            <p className="text-gray-600">Por favor espera mientras confirmamos tu correo</p>
          </div>
        )}

        {status === "success" && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 rounded-full p-3">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-semibold mb-2 text-gray-900">¡Verificación Exitosa!</h1>
            <p className="text-gray-600 mb-6">Tu correo ha sido verificado con éxito</p>
            <p className="text-sm text-gray-500 mb-6">
              {redirecting ? "Redirigiendo a inicio de sesión..." : "Serás redirigido en unos segundos"}
            </p>
            <Link
              href="/auth/login"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Ir a Iniciar Sesión
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-red-100 rounded-full p-3">
                <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-semibold mb-2 text-gray-900">Error en la Verificación</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link
              href="/auth/login"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Volver a Iniciar Sesión
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
