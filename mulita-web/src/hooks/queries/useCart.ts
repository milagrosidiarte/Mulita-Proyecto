import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface CartItem {
  id: string;
  producto_id: string;
  carrito_id: string;
  cantidad: number;
  precio: number;
  producto?: {
    id: string;
    nombre: string;
    descripcion?: string;
    imagen?: string;
    precio: number;
  };
}

export interface Cart {
  id: string;
  usuario_id: string;
  total: number;
  cantidad_items: number;
  items: CartItem[];
  creado_en: string;
  actualizado_en: string;
}

export function useCart() {
  const queryClient = useQueryClient();

  // Obtener carrito
  const { data: cartData, isLoading, error, isError } = useQuery({
    // La clave identifica este dato dentro del caché de React Query.
    queryKey: ["carrito"],
    // Consulta al backend el carrito del usuario actual.
    queryFn: async () => {
      const res = await fetch("/api/carrito", {
        method: "GET",
        credentials: "include",
      });

      // Si no hay sesión, devolvemos un carrito vacío en vez de tirar error.
      if (res.status === 401) {
        return { carrito: null, items: [] };
      }

      // Cualquier otro error sí se considera fallo real.
      if (!res.ok) {
        throw new Error("Error al cargar carrito");
      }

      return res.json();
    },
    // Durante 2 minutos el dato se considera fresco y no se vuelve a pedir.
    staleTime: 1000 * 60 * 2, // 2 minutos
    // Si falla la consulta, intenta una vez más.
    retry: 1,
  });

  // Separar el carrito y sus items hace más cómodo usar el hook en componentes.
  const cart = cartData?.carrito;
  const items = cartData?.items || [];

  // Agregar item
  const addItemMutation = useMutation({
    mutationFn: async (variables: {
      productoId: string;
      cantidad: number;
      precio: number;
    }) => {
      // POST para agregar un producto al carrito del usuario.
      const res = await fetch("/api/carrito", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          producto_id: variables.productoId,
          cantidad: variables.cantidad,
          precio: variables.precio,
        }),
      });
 
      if (!res.ok) { // Si la respuesta no es exitosa, lanzamos un error para que React Query lo maneje.
        throw new Error("Error al agregar item");
      }

      return res.json(); // La API devuelve el carrito actualizado y los items, que se usan para actualizar el caché.
    },
    onSuccess: (data) => { // 
      // Si la API devuelve carrito e items completos, actualizamos el caché sin volver a pedir todo.
      if (data.items && data.carrito) {
        queryClient.setQueryData(["carrito"], {
          carrito: data.carrito,
          items: data.items,
        });
      } else {
        // Si la respuesta viene incompleta, forzamos una recarga del carrito.
        queryClient.invalidateQueries({ queryKey: ["carrito"] });
      }
    },
  });

  // Eliminar item
  const removeItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      // DELETE para quitar un item específico del carrito.
      const res = await fetch(`/api/carrito/${itemId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Error al eliminar item");
      }

      return res.json();
    },
    onSuccess: (data) => {
      // Actualizamos el caché con los items que devuelve la API.
      if (data.items !== undefined) {
        // Recuperamos el carrito actual para recalcular totales sin pedir todo de nuevo.
        const currentData = queryClient.getQueryData<{ carrito: Cart; items: CartItem[] }>([
          "carrito",
        ]);
        if (currentData?.carrito) {
          // Recalculamos total y cantidad total a partir de los nuevos items.
          const newTotal = data.items.reduce(
            (sum: number, item: CartItem) => sum + item.precio * item.cantidad,
            0
          );
          const newCantidad = data.items.reduce((sum: number, item: CartItem) => sum + item.cantidad, 0);
          // Actualizamos el caché con el carrito actualizado y los items nuevos.
          queryClient.setQueryData(["carrito"], {
            carrito: {
              ...currentData.carrito,
              total: newTotal,
              cantidad_items: newCantidad,
            },
            items: data.items,
          });
        }
      } else {
        // Si la API no devuelve items, recargamos todo el carrito.
        queryClient.invalidateQueries({ queryKey: ["carrito"] });
      }
    },
  });

  // Actualizar cantidad
  const updateItemQuantityMutation = useMutation({
    mutationFn: async (variables: { itemId: string; cantidad: number }) => {
      // PUT para cambiar la cantidad de un item ya existente.
      const res = await fetch(`/api/carrito/${variables.itemId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cantidad: variables.cantidad }),
      });

      if (!res.ok) {
        throw new Error("Error al actualizar item");
      }

      return res.json();
    },
    onSuccess: (data) => {
      // Igual que al eliminar, aprovechamos la respuesta para actualizar el caché.
      if (data.items !== undefined) {
        // Tomamos el carrito actual para mantener sus campos y solo recalcular lo que cambió.
        const currentData = queryClient.getQueryData<{ carrito: Cart; items: CartItem[] }>([
          "carrito",
        ]);
        if (currentData?.carrito) {
          // Recalculamos total y cantidad total desde los items actualizados.
          const newTotal = data.items.reduce(
            (sum: number, item: CartItem) => sum + item.precio * item.cantidad,
            0
          );
          const newCantidad = data.items.reduce((sum: number, item: CartItem) => sum + item.cantidad, 0);

          queryClient.setQueryData(["carrito"], {
            carrito: {
              ...currentData.carrito,
              total: newTotal,
              cantidad_items: newCantidad,
            },
            items: data.items,
          });
        }
      } else {
        // Si la respuesta no trae items, volvemos a consultar.
        queryClient.invalidateQueries({ queryKey: ["carrito"] });
      }
    },
  });

  // Limpiar carrito
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      // DELETE sin id para vaciar todo el carrito.
      const res = await fetch("/api/carrito", {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Error al limpiar carrito");
      }

      return res.json();
    },
    onSuccess: () => {
      // Dejamos el caché en estado vacío para que la UI se actualice al instante.
      queryClient.setQueryData(["carrito"], {
        carrito: null,
        items: [],
      });
    },
  });

  // Suma precio unitario por cantidad de cada item para obtener el total.
  const getTotalPrice = () => {
    return items.reduce((total: number, item: CartItem) => total + item.precio * item.cantidad, 0);
  };

  // Suma la cantidad de todos los items del carrito.
  const getTotalItems = () => {
    return items.reduce((total: number, item: CartItem) => total + item.cantidad, 0);
  };

  // Wrappers que aceptan callbacks en el segundo parámetro
  const addItem = (
    variables: { productoId: string; cantidad: number; precio: number },
    options?: { onSuccess?: () => void; onError?: (error: any) => void }
  ) => {
    // Adaptamos mutate para que quien usa el hook pueda pasar callbacks opcionales.
    addItemMutation.mutate(variables, {
      onSuccess: options?.onSuccess,
      onError: options?.onError,
    });
  };

  const removeItem = (
    variables: { itemId: string },
    options?: { onSuccess?: () => void; onError?: (error: any) => void }
  ) => {
    // Solo extraemos itemId porque la mutación interna recibe ese valor directamente.
    removeItemMutation.mutate(variables.itemId, {
      onSuccess: options?.onSuccess,
      onError: options?.onError,
    });
  };

  const updateItemQuantity = (
    variables: { itemId: string; newQuantity: number },
    options?: { onSuccess?: () => void; onError?: (error: any) => void }
  ) => {
    // Convertimos newQuantity al nombre que espera la mutación interna.
    updateItemQuantityMutation.mutate(
      { itemId: variables.itemId, cantidad: variables.newQuantity },
      {
        onSuccess: options?.onSuccess,
        onError: options?.onError,
      }
    );
  };

  const clearCart = (
    variables?: any,
    options?: { onSuccess?: () => void; onError?: (error: any) => void }
  ) => {
    // No necesitamos variables, solo mantenemos la firma parecida a los otros wrappers.
    clearCartMutation.mutate(undefined, {
      onSuccess: options?.onSuccess,
      onError: options?.onError,
    });
  };

  return {
    cart,
    items,
    isLoading,
    error: error?.message,
    isError,
    addItem,
    removeItem,
    updateItemQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
    isAddingItem: addItemMutation.isPending,
    isRemovingItem: removeItemMutation.isPending,
    isUpdatingItem: updateItemQuantityMutation.isPending,
    isClearingCart: clearCartMutation.isPending,
  };
}
