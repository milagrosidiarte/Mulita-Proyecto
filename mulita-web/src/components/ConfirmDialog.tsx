"use client";

import { useState } from "react";
import toast from "react-hot-toast";

// define que datos espera el componente
interface ConfirmDialogProps {
  title: string; // titulo del cuadro de confirmación
  message: string; // mensaje descriptivo
  confirmText?: string; // texto del botón de confirmación
  cancelText?: string; // texto del botón de cancelación
  onConfirm: () => void | Promise<void>; // función que se ejecuta al confirmar
  isOpen: boolean; // indica si el cuadro de confirmación está abierto
  onClose: () => void; // función que se ejecuta al cerrar el cuadro de confirmación
  isDangerous?: boolean; // indica si la acción es peligrosa (cambia el color del botón de confirmación)
}

// recibe los props y asigna valores por defecto a los opcionales
// renderiza el cuadro de confirmación si isOpen es true
export default function ConfirmDialog({
  title, 
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  onConfirm,
  isOpen,
  onClose,
  isDangerous = false,
}: ConfirmDialogProps) { // define el estado de carga para el botón de confirmación (para saber si la confirmación está en proceso)
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => { // Maneja la confirmación, ejecutando la función onConfirm y cerrando el cuadro de diálogo
    setIsLoading(true); // indica que la confirmación está en proceso
    try {
      await onConfirm();
      onClose(); // cierra el cuadro de diálogo después de la confirmación
    } catch (error) {
      console.error("Error en confirmación:", error);
    } finally {
      setIsLoading(false); // indica que la confirmación ha terminado
    }
  };

  if (!isOpen) return null; // si isOpen es false, no renderiza nada

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto"
      onClick={(e) => {
        // Cerrar solo si se hace clic en el fondo, no en el diálogo
        if (e.target === e.currentTarget) { // verifica si el clic fue en el fondo
          e.stopPropagation(); // evita que el clic se propague al fondo
          onClose(); // cierra el cuadro de diálogo
        }
      }}
    >
      <div
        className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4" 
        onClick={(e) => e.stopPropagation()} // 
      >
        <h2 className="text-lg font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>

        <div className="flex gap-3 justify-end"> // contenedor de los botones de acción
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button 
            onClick={(e) => { 
              e.stopPropagation();
              handleConfirm();
            }}
            disabled={isLoading} // deshabilita el botón mientras se está procesando la confirmación
            className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold ${
              isDangerous // cambia el color del botón de confirmación si la acción es peligrosa
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isLoading ? "..." : confirmText} // muestra "..." mientras se está procesando la confirmación
          </button>
        </div>
      </div>
    </div>
  );
}


// Este componente es un modal genérico para confirmar acciones importantes. 
// Sirve para eliminar, guardar o ejecutar operaciones sensibles, y evita que el usuario confirme accidentalmente.