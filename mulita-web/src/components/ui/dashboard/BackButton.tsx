"use client";

import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  const handleBack = () => {
    // Extraer segmentos de la ruta
    const segments = pathname.split("/").filter(Boolean);
    
    // Siempre volver un nivel arriba en la ruta
    if (segments.length > 1) {
      const parentPath = "/" + segments.slice(0, segments.length - 1).join("/");
      router.push(parentPath); // Navegar al nivel superior
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleBack}
      className="flex-shrink-0 inline-flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 mt-2"
      title="Volver"
    >
      <ChevronLeft className="w-6 h-6" />
    </button>
  );
}
