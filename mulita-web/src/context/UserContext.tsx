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

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Recuperar sesión desde la API al montar
  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Error recuperando sesión:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Sincronizar sesión de Supabase con el estado del usuario
  const syncSupabaseSession = async () => {
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
    fetchUser();
    
    // Sincronizar con Supabase cada vez que cambie el estado de autenticación
    const supabase = createClientSupabase();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await fetchUser();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    const interval = setInterval(fetchUser, 5 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, []);

  // Cerrar sesión
  const logout = async () => {
    try {
      // 1. Cerrar sesión en Supabase
      const supabase = createClientSupabase();
      await supabase.auth.signOut();
      
      // 2. Cerrar sesión en el backend (limpiar cookies)
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      // 3. Limpiar estado
      setUser(null);
      toast.success("Sesión cerrada exitosamente");
      router.push("/");
    } catch (err) {
      console.error("Error cerrando sesión:", err);
      toast.error("Error al cerrar sesión");
      setUser(null);
      router.push("/");
    }
  };

  const isSuperAdmin = () => user?.rol === "superAdmin";

  return (
    <UserContext.Provider value={{ user, setUser, logout, loading, isSuperAdmin }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser debe usarse dentro de UserProvider");
  }
  return context;
}
