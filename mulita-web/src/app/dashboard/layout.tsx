"use client";

import { ReactNode, useState } from "react";
import SidebarDashboard from "@/components/ui/dashboard/SidebarDashboard";
import HeaderDashboard from "@/components/ui/dashboard/HeaderDashboard";
import BackButton from "@/components/ui/dashboard/BackButton";

// Definimos la función para el layout del dashboard, que incluye la barra lateral, el encabezado y un botón de retroceso
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#f9fafb]">
      <SidebarDashboard isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="flex flex-col flex-1 ml-0 md:ml-60 transition-all duration-300">
        <HeaderDashboard onMenuClick={() => setMenuOpen(true)} />
        <main className="flex-1 p-4 md:p-8">
          <div className="flex items-start gap-4 mb-6">
            <BackButton />
            <div className="flex-1">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}