// crea el cliente de Supabase que se usa del lado servidor (no se usa en componentes del navegador) para manejar autenticación y operaciones de base de datos
import { createClient } from "@supabase/supabase-js"; 

// Cliente para el servidor (API routes, middleware, etc.)
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, // URL de Supabase (obtenida de las variables de entorno)
  process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY!, // Clave de servicio (obtenida de las variables de entorno)
);

//Te permite hacer operaciones seguras desde el backend, como:
// validar sesión
// leer usuario autenticado
// consultar la tabla usuario
// refrescar sesión
// aplicar permisos
// hacer operaciones administrativas