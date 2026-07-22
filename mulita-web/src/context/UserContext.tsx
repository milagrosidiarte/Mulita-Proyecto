"use client"; // corre en el navegador

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientSupabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";

interface User { // Define la estructura del usuario, es la forma de los datos que se esperan.
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

interface UserContextType {
  user: User | null; // usuario actual, puede ser null si no hay sesión
  setUser: (user: User | null) => void; // función para actualizar el usuario en el contexto
  logout: () => Promise<void>; // función para cerrar sesión
  loading: boolean; // indica si todavía se está cargando el usuario
  isSuperAdmin: () => boolean; //para saber si es SuperAdmin
}

const UserContext = createContext<UserContextType | undefined>(undefined); // crea el “contenedor” donde va a vivir esa información.

export function UserProvider({ children }: { children: React.ReactNode }) { // componente  que envuelve a otros componentes y les comparte el estado del usuario.
  const [user, setUser] = useState<User | null>(null); // estado local para almacenar el usuario actual
  const [loading, setLoading] = useState(true); // estado para indicar si todavía se está cargando el usuario
  const router = useRouter(); // hook de Next.js que permite redirigir despues del logout.

  // Obtener usuario actual desde el backend
  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      if (res.ok) { // si la respuesta es correcta, guarda data.user en el estado del contexto. Si no, guarda null.
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) { // si hay un error, también guarda null y muestra el error en consola.
      console.error("Error recuperando sesión:", err);
      setUser(null);
    } finally { // al final, aunque haya error o no, indica que ya terminó de cargar.
      setLoading(false);
    }
  };

  // Sincronizar sesión de Supabase con el estado del usuario
  const syncSupabaseSession = async () => { // no se usa porque fetchUser() ya hace lo mismo, pero sirve para entender la lógica de sincronización.
    try {
      const supabase = createClientSupabase();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session && !user) {
        // Si hay sesión en Supabase pero no en el contexto, intentar recuperar usuario
        await fetchUser();
      } else if (!session && user) {
        // Si no hay sesión en Supabase pero sí en el contexto, limpiar contexto
        setUser(null);
      }
    } catch (err) {
      console.error("Error sincronizando sesión de Supabase:", err);
    }
  };

  useEffect(() => {
    fetchUser(); // Llama a fetchUser() una vez al arrancar. Así la app intenta recuperar la sesión apenas carga.
    
    // Sincronizar con Supabase cada vez que cambie el estado de autenticación
    const supabase = createClientSupabase();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => { // escucha cambios de autenticación
        if (event === 'SIGNED_IN' && session) { 
          await fetchUser(); // llama a fetchUser() si hay sesión
        } else if (event === 'SIGNED_OUT') {
          setUser(null); // limpia el estado del usuario si no hay sesión
        }
      }
    );

    const interval = setInterval(fetchUser, 5 * 60 * 1000); // ejecuta fetchUser() cada 5 minutos, para mantener sincronizado el estado aunque pase tiempo
    
    // Cleanup function para limpiar el intervalo y la suscripción cuando el componente se desmonte
    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, []);

  // Cerrar sesión
  const logout = async () => {
    try {
      // 1. Cerrar sesión en Supabase
      const supabase = createClientSupabase(); // crea un cliente de Supabase para poder interactuar con la autenticación
      await supabase.auth.signOut(); // cierra la sesión en Supabase, lo que invalida el token de autenticación y limpia la sesión del lado del cliente.
      
      // 2. Cerrar sesión en el backend (limpiar cookies)
      const res = await fetch("/api/auth/logout", { // llama a la ruta de logout del backend para limpiar las cookies de sesión.
        method: "POST",
        credentials: "include",
      });

      // 3. Limpiar estado
      setUser(null); // limpia el estado del usuario en el contexto
      toast.success("Sesión cerrada exitosamente");
      router.push("/"); // redirige a inicio después de cerrar sesión
    } catch (err) { // si hay un error, muestra el error en consola, muestra un toast de error, limpia el estado del usuario y redirige a inicio.
      console.error("Error cerrando sesión:", err);
      toast.error("Error al cerrar sesión");
      setUser(null);
      router.push("/");
    }
  };

  const isSuperAdmin = () => user?.rol === "superAdmin"; // función que devuelve true si el usuario actual es superAdmin, sirve para mostrar u ocultar ciertas funcionalidades según el rol del usuario.

  // Proveer el contexto a los componentes hijos
  // Eso hace posible que cualquier componente dentro de UserProvider lea ese estado sin repetir fetchs.
  return (
    <UserContext.Provider value={{ user, setUser, logout, loading, isSuperAdmin }}>
      {children}
    </UserContext.Provider>
  );
}

// Hook para usar el contexto del usuario en cualquier componente
export function useUser() {
  const context = useContext(UserContext); 
  if (!context) { // si el contexto no está definido, significa que useUser() se está llamando fuera de un UserProvider, lo cual es un error de uso.
    throw new Error("useUser debe usarse dentro de UserProvider");
  }
  return context;
}

// useUser de queries es el que va a buscar el usuario y mantenerlo actualizado; 
// el de contexto es el que reparte ese usuario a varios componentes sin repetir la consulta.