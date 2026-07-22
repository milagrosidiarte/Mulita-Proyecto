"use client";

import { useState } from "react";

type ImagenModalProps = {
  images: string[];
  initialIndex: number;
  onClose: () => void;
};

// ModalImagenActividades es un componente que muestra un modal con una imagen y permite navegar entre varias imágenes.
export default function ModalImagenActividades({
  images,
  initialIndex,
  onClose,
}: ImagenModalProps) { // Recibimos las imágenes, el índice inicial y la función para cerrar el modal
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const nextImage = () =>
    setCurrentIndex((prev) => (prev + 1) % images.length); // Avanzamos al siguiente índice, y si llegamos al final, volvemos al inicio
  const prevImage = () =>
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length); // Retrocedemos al índice anterior, y si llegamos al inicio, vamos al final

  return (
    <div
      className="fixed inset-0 bg-gray-900/60 z-[9999] flex flex-col justify-center items-center py-4 px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[currentIndex]}
          alt={`Imagen ${currentIndex + 1}`}
          className="w-full max-w-xl h-auto max-h-[70vh] object-contain rounded-lg shadow-lg"
        />
        {/* Botón de cerrar */}
        <button
          onClick={onClose}
          className="fixed top-6 right-90 z-[60] flex items-center justify-center w-10 h-10 rounded-full bg-black/70 text-white text-2xl hover:bg-black/90 transition-colors"
          aria-label="Cerrar"
        >
          ✕
        </button>

        {/* Navegación entre imágenes */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-black/70 text-white text-xl hover:bg-black/90 transition-colors"
            >
              ‹
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-black/70 text-white text-xl hover:bg-black/90 transition-colors"
            >
              ›
            </button>
          </>
        )}
      </div>
    </div>
  );
}
