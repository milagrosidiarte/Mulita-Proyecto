import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

// Este hook encapsula la lógica de obtener el usuario actual 
// y manejar el logout, usando React Query para manejar 
// el estado de la petición y la mutación.

export interface User { // Define la forma de los datos de usuario esperados, esto tipa el user que vuelve del endpoint.
  id: string;
  email: string;
  rol: string;
  nombre: string;
  apellido: string;
  telefono: string;
  acceso_comunidad: boolean;
  imagen?: string;
  docente?: any;
}

export function useUser() { 
  const router = useRouter();
  const queryClient = useQueryClient();

  // Obtener usuario actual
  // internamente usa useQuery para hacer una petición a /api/auth/me.
  const { data: user, isLoading, error, isError } = useQuery({ // estado de la query, si está cargando, si hubo error, etc.
    queryKey: ["user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include", // Esto asegura que las cookies de sesión se envíen con la solicitud, lo cual es necesario para autenticar al usuario.
      });

      if (res.status === 401) {
        return null; // No autenticado
      }

      if (!res.ok) {
        throw new Error("Error al obtener usuario");
      }

      const data = await res.json();
      return data.user as User;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchInterval: 1000 * 60 * 5, // Revalidar cada 5 minutos
    retry: 1,
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Error al cerrar sesión");
      }

      return res.json();
    },
    onSuccess: () => {
      // Limpiar todo el caché
      queryClient.clear();
      // Redirigir al inicio
      router.push("/");
    },
  });

  const isSuperAdmin = () => user?.rol === "superAdmin";

  // Wrapper que acepta callbacks opcionales
  const logout = (options?: { onSuccess?: () => void; onError?: (error: any) => void }) => {
    logoutMutation.mutate(undefined, {
      onSuccess: options?.onSuccess,
      onError: options?.onError,
    });
  };

  return {
    user,
    isLoading,
    error: error?.message,
    isError,
    logout,
    isLoggingOut: logoutMutation.isPending,
    isSuperAdmin, // Función para verificar si el usuario es superadmin
  };
}


// sirve para una sola idea central: saber quién es el usuario actual, 
// guardar ese dato mientras la app lo necesita, y ofrecer una forma fácil de cerrar sesión.
// En vez de repetir en cada pantalla “andá a buscar el usuario”, 
// este archivo concentra esa lógica en una función reutilizable llamada useUser. 
// Eso hace que cualquier componente pueda pedir el usuario actual con una sola línea que seria: 
// const { user, isLoading, error } = useUser();