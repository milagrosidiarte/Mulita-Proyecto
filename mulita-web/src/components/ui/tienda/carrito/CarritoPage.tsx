"use client";

import { useCart } from "@/hooks/queries";
import type { CartItem } from "@/hooks/queries/useCart";
import { Trash2, Plus, Minus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import ConfirmDialog from "@/components/ConfirmDialog";
import CompraModal from "../CompraModal";

export function CarritoPage() {
  const { items, isLoading, removeItem, updateItemQuantity, clearCart, getTotalPrice } = useCart();
  const [processing, setProcessing] = useState(false);
  //un objeto que guarda temporalmente la cantidad que el usuario está 
  // escribiendo en el input de cada ítem, antes de que se confirme el cambio real
  const [localQuantities, setLocalQuantities] = useState<Record<string, number>>({}); 
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({}); // un objeto que guarda los timers de debounce para cada ítem, para evitar que se hagan demasiadas llamadas al servidor mientras el usuario escribe
  const [compraOpen, setCompraOpen] = useState(false);
  const [showConfirmClearCart, setShowConfirmClearCart] = useState(false);

  // Función para eliminar un ítem del carrito
  const handleRemoveItem = (itemId: string) => {
    setProcessing(true);
    removeItem(
      { itemId },
      {
        onSuccess: () => {
          toast.success("Producto eliminado del carrito");
          setProcessing(false);
        },
        onError: (error) => {
          toast.error("Error al eliminar producto");
          setProcessing(false);
        },
      }
    );
  };

  // Función para actualizar la cantidad de un ítem en el carrito
  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return; // Evitar cantidades menores a 1
    setProcessing(true);
    updateItemQuantity(
      { itemId, newQuantity },
      {
        onSuccess: () => setProcessing(false),
        onError: (error) => {
          toast.error("Error al actualizar cantidad");
          setProcessing(false);
        },
      }
    );
  };

  // Función para manejar el cambio de cantidad en el input, con debounce
  const handleQuantityInput = (itemId: string, value: number) => {
    if (value > 0) {
      setLocalQuantities((prev) => ({ ...prev, [itemId]: value })); // Guardar la cantidad localmente mientras el usuario escribe, para que el input se vea con el número que el usuario está escribiendo
      
      // Limpiar el timeout anterior si existe, para no disparar múltiples actualizaciones si el usuario sigue escribiendo
      if (debounceTimers.current[itemId]) {
        clearTimeout(debounceTimers.current[itemId]); 
      }
      
      // Crear un nuevo timeout para actualizar después de 800ms
      debounceTimers.current[itemId] = setTimeout(async () => {
        const item = items.find((i: any) => i.id === itemId); // Buscar el ítem correspondiente en el carrito
        if (item && value !== item.cantidad) { // compara si el valor realmente cambió,
          await handleQuantityChange(itemId, value); // llama a la función que actualiza la cantidad en el carrito
        }
        // Limpiar el estado local
        setLocalQuantities((prev) => {
          const newState = { ...prev }; // crear una copia del estado anterior
          delete newState[itemId]; // eliminar la propiedad del ítem que ya se actualizó
          return newState; // actualizar el estado con la copia modificada
        });
      }, 800); // 800ms de debounce para evitar múltiples llamadas al servidor mientras el usuario escribe
    }
  };

  // Función para vaciar el carrito
  const handleClearCart = async () => {
    setProcessing(true);
    clearCart(
      {},
      {
        onSuccess: () => {
          toast.success("Carrito vaciado exitosamente");
          setProcessing(false);
          setShowConfirmClearCart(false); // Cerrar el diálogo de confirmación después de vaciar el carrito
        },
        onError: (error) => {
          toast.error("Error al vaciar carrito");
          setProcessing(false); // no cierrar el diálogo de confirmación si hay un error
        },
      }
    );
  };

  // Obtener cantidad actual del input local o del item
  const getItemQuantity = (itemId: string, defaultQuantity: number) => {
    return localQuantities[itemId] !== undefined ? localQuantities[itemId] : defaultQuantity; // si hay un valor local, usarlo, sino usar el valor del item
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ConfirmDialog
        isOpen={showConfirmClearCart}
        onClose={() => setShowConfirmClearCart(false)}
        title="Vaciar carrito"
        message="¿Estás seguro de que deseas vaciar tu carrito? Esta acción no se puede deshacer."
        confirmText="Vaciar"
        cancelText="Cancelar"
        isDangerous={true}
        onConfirm={handleClearCart}
      />
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tu Carrito de Compras</h1>
            <p className="text-gray-600">{items.length} producto{items.length !== 1 ? "s" : ""}</p>
          </div>

          {/* Contenido del carrito */}
          {items.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Tu carrito está vacío</h2>
              <p className="text-gray-600 mb-6">Añade productos para comenzar tus compras</p>
              <Link
                href="/tienda"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                Ir a la tienda
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Items */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  {items.map((item: CartItem) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-6 border-b last:border-b-0 hover:bg-gray-50 transition"
                    >
                      {/* Imagen del producto */}
                      {item.producto?.imagen && (
                        <Link href={`/tienda?productId=${item.producto_id}`}>
                          <div className="flex-shrink-0 w-24 h-24 relative cursor-pointer hover:opacity-75 transition">
                            <Image
                              src={item.producto.imagen}
                              alt={item.producto.nombre}
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                        </Link>
                      )}

                      {/* Detalles del producto */}
                      <Link href={`/tienda?productId=${item.producto_id}`} className="flex-1 cursor-pointer hover:opacity-75 transition">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {item.producto?.nombre || `Producto (${item.producto_id?.slice(0, 8)}...)`}
                        </h3>
                        {item.producto?.descripcion && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {item.producto.descripcion}
                          </p>
                        )}
                        <p className="text-lg font-bold text-blue-600 mt-2">
                          ${item.precio.toLocaleString("es-AR")}
                        </p>
                      </Link>

                      {/* Cantidad */}
                      <div className="flex items-center gap-2">
                        <button
                          aria-label="menos"
                          onClick={() => handleQuantityChange(item.id, item.cantidad - 1)}
                          disabled={processing}
                          className="p-1 hover:bg-gray-200 rounded transition disabled:opacity-50"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <input
                          aria-label="cantidad"
                          type="number"
                          min="1"
                          value={getItemQuantity(item.id, item.cantidad)}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            handleQuantityInput(item.id, value);
                          }}
                          disabled={processing}
                          className="w-12 text-center border rounded px-2 py-1 disabled:opacity-50"
                        />
                        <button
                          aria-label="mas"
                          onClick={() => handleQuantityChange(item.id, item.cantidad + 1)}
                          disabled={processing}
                          className="p-1 hover:bg-gray-200 rounded transition disabled:opacity-50"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="w-28 text-right">
                        <p className="text-sm text-gray-600 mb-1">Subtotal</p>
                        <p className="text-lg font-bold text-gray-900">
                          ${(item.precio * item.cantidad).toFixed(2).toLocaleString()}
                        </p>
                      </div>

                      {/* Eliminar */}
                      <button
                        aria-label="eliminar"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={processing}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition disabled:opacity-50"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Botón vaciar carrito */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setShowConfirmClearCart(true)}
                    disabled={processing}
                    className="text-red-600 hover:text-red-700 font-semibold disabled:opacity-50"
                  >
                    Vaciar carrito
                  </button>
                </div>
              </div>

              {/* Resumen */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow p-6 sticky top-4">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">Resumen del pedido</h2>

                  {/* Total */}
                  <div className="flex justify-between mb-6">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ${getTotalPrice().toFixed(2).toLocaleString("es-AR")}
                    </span>
                  </div>

                  {/* Mensaje de aviso */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-amber-800">
                      <span className="font-semibold">⚠️ Nota importante:</span> El precio mostrado no incluye los costos de envío. El total final se coordinará vía WhatsApp.
                    </p>
                  </div>

                  {/* Botón checkout */}
                  <button 
                    onClick={() => setCompraOpen(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition mb-3"
                  >
                    Proceder al pago
                  </button>

                  {/* Continuar comprando */}
                  <Link
                    href="/tienda"
                    className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-lg transition"
                  >
                    Continuar comprando
                  </Link>
                </div>
              </div>

              {/* MODAL DE COMPRA */}
              <CompraModal
                open={compraOpen}
                onClose={() => setCompraOpen(false)}
                items={items}
                source="cart"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
