"use client";

import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { ReactNode } from "react";

const queryClient = new QueryClient({ // Configuración del cliente de React Query
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 10, // 10 minutos
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function ProvidersWrapper({ children }: { children: ReactNode }) { 
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>; 
  // Proporciona el contexto de React Query a toda la aplicación, 
  // permitiendo el uso de hooks como useQuery y useMutation en cualquier componente hijo.
}
