"use client";

import { useUser } from "@/hooks/queries";
import { Shield, Users, Zap, User } from "lucide-react";

export default function UserRoleBadge() {
  const { user, isLoading } = useUser();

  // Si los datos del usuario aún se están cargando o no hay usuario, no renderizamos nada
  if (isLoading || !user) {
    return null;
  }

  // Mapeo de roles a colores, iconos y etiquetas
  const roleConfig: Record<string, {
    color: string; 
    bgColor: string; 
    label: string; 
    icon: React.ReactNode;
    description: string;
  }> = {
    superAdmin: {
      color: "text-red-700",
      bgColor: "bg-red-50 border-red-200",
      label: "Super Administrador",
      icon: <Shield className="w-4 h-4" />,
      description: "Acceso total al sistema"
    },
    admin: {
      color: "text-blue-700",
      bgColor: "bg-blue-50 border-blue-200",
      label: "Administrador",
      icon: <Zap className="w-4 h-4" />,
      description: "Acceso a gestión de contenido"
    },
    docente: {
      color: "text-green-700",
      bgColor: "bg-green-50 border-green-200",
      label: "Docente",
      icon: <Users className="w-4 h-4" />,
      description: "Acceso a comunidad"
    },
    usuario: {
      color: "text-gray-700",
      bgColor: "bg-gray-50 border-gray-200",
      label: "Usuario",
      icon: <User className="w-4 h-4" />,
      description: "Acceso limitado"
    }
  };

  // Obtenemos la configuración del rol del usuario, o usamos la configuración por defecto si el rol no está definido
  const config = roleConfig[user.rol] || roleConfig.usuario;

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${config.bgColor}`}>
      <div className={`${config.color}`}>
        {config.icon}
      </div>
      <div className="flex flex-col">
        <span className={`font-semibold text-sm ${config.color}`}>
          {config.label}
        </span>
        <span className="text-xs text-gray-600">
          {config.description}
        </span>
      </div>
    </div>
  );
}
