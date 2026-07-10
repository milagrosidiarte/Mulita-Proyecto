import { createClient } from "@supabase/supabase-js";

// Cliente para el frontend (con persistencia en localStorage)
export const createClientSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { // Configuración de autenticación
        persistSession: true, // Permite que la sesión se mantenga entre recargas de página
        storage: typeof window !== 'undefined' ? localStorage : undefined, // Usa localStorage para persistir la sesión en el navegador, pero no en el servidor
      },
    }
  );
};

// Exportamos el cliente del frontend como default para compatibilidad
export const supabase = createClientSupabase();