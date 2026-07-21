"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UbicacionInput from "./ubicacion/UbicacionInput";
import { useUser } from "@/hooks/queries";
import { useCart } from "@/hooks/queries"; // trae funciones para manejar el carrito
import { toast } from "react-hot-toast";
import { CartItem } from "@/context/CartContext";

export type CompraModalProps = {
  open: boolean;
  onClose: () => void;
  items: CartItem[];
  source?: "cart" | "product"; // 'cart' = desde el carrito, 'product' = desde un producto
};


// Funcion de validacionm algoritmo oficial de validacion de CUIT/CUIL de Argentina
function validarCuit(cuit: string): boolean {
  if (!/^\d{11}$/.test(cuit)) return false;

  const coef = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let suma = 0;

  for (let i = 0; i < 10; i++) {
    suma += parseInt(cuit[i], 10) * coef[i];
  }

  const resto = suma % 11;
  const digitoVerificador = resto === 0 ? 0 : resto === 1 ? 9 : 11 - resto;

  return digitoVerificador === parseInt(cuit[10], 10);
}

// Validación de razón social: al menos 3 caracteres, solo letras, 
// números, espacios y algunos caracteres especiales permitidos
// esta fuera del componente porque no depende de su estado y puede ser reutilizada
function validarRazonSocial(nombre: string): boolean {
  if (!nombre) return false; // No vacío
  if (nombre.trim().length < 3) return false; // Al menos 3 caracteres
  return /^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ ,.()\-]+$/.test(nombre.trim()); // Solo caracteres permitidos
}

// Componente principal del modal de compra
export default function CompraModal({ open, onClose, items, source = "cart" }: CompraModalProps) { // source indica si la compra viene del carrito o de un producto individual
  const { user: usuario } = useUser(); // trae el usuario logueado
  const { clearCart } = useCart(); // trae la funcion para vaciar el carrito
  const router = useRouter(); // para redirigir a login si no hay usuario
  const [cantidad, setCantidad] = useState(1); // cantidad de productos a comprar, por defecto 1

  // Datos fiscales
  const [razonSocial, setRazonSocial] = useState<"Consumidor Final" | "Responsable Inscripto">("Consumidor Final"); // por defecto Consumidor Final
  const [cuit, setCuit] = useState("");  // CUIT/CUIL, por defecto vacío
  const [fiscalId, setFiscalId] = useState<string | null>(null); // ID del registro de datos fiscales en la base de datos, por defecto null

  const [ubicacion, setUbicacion] = useState(""); // dirección del usuario, por defecto vacío
  const [coordenadas, setCoordenadas] = useState<{ lat: string; lon: string } | null>(null); // coordenadas de la ubicación seleccionada, por defecto null

  const [errores, setErrores] = useState({ // objeto para manejar errores de validación
    razonSocial: "", // error de razón social
    cuit: "", // error de CUIT/CUIL
    direccion: "", // error de dirección
  });
  
  // Función para limpiar errores de validación de un campo específico
  const limpiarError = (campo: keyof typeof errores) => {
    setErrores((prev) => ({ ...prev, [campo]: "" }));
  };


  // Si el usuario no está logueado mostrar toast y redirigir a login
  useEffect(() => {
    if (open && !usuario) {
      toast.error("Debes iniciar sesión para poder comprar");
      onClose();
      setTimeout(() => {
        router.push("/auth/login");
      }, 1500);
    }
  }, [open, usuario, onClose, router]);

  // Manejar el estilo del body cuando el modal está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"; // Evita el scroll del body cuando el modal está abierto
    } else {
      document.body.style.overflow = ""; // Restaura el scroll del body cuando el modal se cierra
    }

    return () => {
      document.body.style.overflow = ""; // Asegura que el scroll se restaure si el componente se desmonta
    };
  }, [open]); // Dependencia de open para ejecutar el efecto cuando cambia

  // Limpiar datos de ubicación y coordenadas cuando el modal se cierra
  useEffect(() => {
  if (!open) {
    setUbicacion("");
    setCoordenadas(null);
  }
}, [open]);

// Función para generar la URL de WhatsApp con el mensaje de confirmación de compra
  const getWhatsAppUrl = ({ // parámetros de la orden
    codigo,
    fecha,
    nombre,
    telefono,
    razonSocial,
    cuit,
    direccion,
    items,
    total,
  }: {
    codigo: string;
    fecha: string;
    nombre: string;
    telefono: string;
    razonSocial: string;
    cuit: string;
    direccion: string;
    items: { nombre: string; cantidad: number; precio_unitario: number }[];
    total: number;
  }) => {
    const telefonoWhatsApp = "59896401738"; // Número de WhatsApp de la tienda para recibir pedidos
    // Formatear el mensaje de WhatsApp con los datos de la orden
    const mensaje = `Hola! Quiero confirmar esta compra:

    *Orden:* ${codigo}
    *Fecha:* ${new Date(fecha).toLocaleDateString()}
    *Nombre:* ${nombre}
    *Teléfono:* ${telefono}

    *Razón social:* ${razonSocial}
    *CUIT/CUIL:* ${cuit}

    *Dirección:* ${direccion}

    Mi pedido es

    ${items.map((i) => // Formatear cada item del pedido
      `• ${i.cantidad}x *${i.nombre}*: $${(i.precio_unitario).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}` // Formatear el precio unitario con dos decimales y separador de miles
    )
    .join("\n")}

    *TOTAL: $${(total).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}* 

    _Espero tu confirmación y los datos bancarios para el pago. ¡Gracias!_
    `;

    return `https://wa.me/${telefonoWhatsApp}?text=${encodeURIComponent(mensaje)}`; // Generar la URL de WhatsApp con el mensaje codificado
  };


  // Cargar datos fiscales al abrir
  useEffect(() => {
    if (!open || !usuario) return; // Si el modal no está abierto o no hay usuario, no hacer nada

    (async () => { // Función asíncrona para obtener los datos fiscales del usuario
      const res = await fetch("/api/datosFiscales", { // Llamada a la API para obtener los datos fiscales
        headers: { "x-user-id": usuario.id }, // Enviar el ID del usuario en los headers
      });

      const data = await res.json(); // Parsear la respuesta JSON
      if (data.datosFiscales) { // Si hay datos fiscales, setear los estados correspondientes
        setFiscalId(data.datosFiscales.id); // Guardar el ID del registro de datos fiscales
        setRazonSocial(data.datosFiscales.razon_social); // Guardar la razón social
        setCuit(data.datosFiscales.cuit_cuil); // Guardar el CUIT/CUIL
      }
    })();
  }, [open, usuario]); // Dependencias: se ejecuta cuando el modal se abre o cambia el usuario

  // Early returns después de todos los hooks
  if (!open) return null;
  if (!usuario) return null;

  // Transforma los items recibidos en el formato esperado para la orden
  const itemsPayload = items.map((item) => ({ // mapear cada item del carrito a un objeto con los datos necesarios para la orden
    producto_id: item.producto_id, // id del producto
    nombre: item.producto?.nombre ?? "Producto", // nombre del producto, si no existe usar "Producto"
    cantidad: item.cantidad, // cantidad del producto
    precio_unitario: item.producto?.precio ?? item.precio, // precio unitario del producto, si no existe usar el precio del item
  }));

  // Calcular total
  const total = itemsPayload.reduce(
    (acc: number, item: any) =>
      acc + item.cantidad * item.precio_unitario,
    0
  );

  // Función para confirmar la compra, validar los datos y enviar la orden a WhatsApp
  const confirmarCompra = async () => { // Función asíncrona para confirmar la compra
    const erroresTemp = { // objeto temporal para almacenar errores de validación
      razonSocial: "", 
      cuit: "",
      cantidad: "",
      direccion: "",
    };

    let valido = true; // bandera para indicar si los datos son válidos

    if (!validarRazonSocial(razonSocial)) { // Validación de razón social: al menos 3 caracteres, solo letras, números, espacios y algunos caracteres especiales permitidos
      erroresTemp.razonSocial = "Razón social inválida. La razón social debe tener al menos 3 caracteres y no contener caracteres especiales.";
      valido = false; // Si la razón social no es válida, marcar como inválido
    }

    // Validación condicional del CUIT según tipo fiscal
    if (razonSocial === "Responsable Inscripto") {
      if (!validarCuit(cuit)) { 
        erroresTemp.cuit = "El CUIT es obligatorio para Responsable Inscripto y debe ser válido.";
        valido = false; 
      }
    } else {
      // Consumidor final → CUIT no obligatorio, pero si lo escribe debe ser válido
      if (cuit.trim() !== "" && !validarCuit(cuit.replace(/\D/g, ""))) {
        erroresTemp.cuit = "El CUIT ingresado no es válido.";
        valido = false;
      }
    }

    // Validación de cantidad y dirección
    if (!cantidad || cantidad <= 0) {
      erroresTemp.cantidad = "La cantidad debe ser mayor a 0.";
      valido = false;
    }
 
    // Validación de dirección: al menos 3 caracteres
    if (!ubicacion || ubicacion.trim().length < 3) {
      erroresTemp.direccion = "Debes ingresar una dirección válida.";
      valido = false;
    }

    setErrores(erroresTemp); // Actualizar el estado de errores con los errores encontrados

    if (!valido) return; // Si no es válido, salir de la función sin continuar

    if (!razonSocial || (razonSocial === "Responsable Inscripto" && !cuit)) return; // Validación final: si no hay razón social o si es Responsable Inscripto y no hay CUIT, salir de la función

    let finalFiscalId = fiscalId; // variable para almacenar el ID fiscal final, inicialmente igual al fiscalId existente

    // Crear / actualizar datos fiscales
    if (fiscalId) {
      // PATCH (actualizar)
      const res = await fetch("/api/datosFiscales", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: fiscalId,
          razon_social: razonSocial,
          cuit_cuil: cuit,
        }),
      });

      const { datosFiscales } = await res.json(); // Parsear la respuesta JSON y obtener los datos fiscales actualizados

      if (!datosFiscales) {
        console.error("Error actualizando datos fiscales");
        return;
      }

      finalFiscalId = datosFiscales.id; // Actualizar el ID fiscal final con el ID del registro actualizado

    } else {
      // POST (crear)
      const res = await fetch("/api/datosFiscales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razon_social: razonSocial,
          cuit_cuil: cuit,
          usuario_id: usuario.id,
        }),
      });

      const { datosFiscales } = await res.json();

      if (!datosFiscales) {
        console.error("Error creando datos fiscales");
        return;
      }

      finalFiscalId = datosFiscales.id;
    }

    if (!finalFiscalId) {
      console.error("No se encontró el ID fiscal después de crear/actualizar.");
      return;
    }

    // Crear la orden
    const res = await fetch("/api/orden", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        usuario_id: usuario.id,
        datos_fiscales_id: finalFiscalId, // usar el ID fiscal final (ya sea creado o actualizado)
        ubicacion,
        lat: coordenadas?.lat ?? null, // si no hay coordenadas, enviar null
        lon: coordenadas?.lon ?? null, 
        items: itemsPayload, // enviar los items de la orden
        total,
      }),
    });

    const data = await res.json(); // Parsear la respuesta JSON de la creación de la orden
    console.log("orden", data.orden); // Log de la orden creada
    console.log("itemsOrden", data.items); // Log de los items de la orden creada

    if (!data) {
      console.error("Error creando la orden");
      return;
    }

    // Generar URL de WhatsApp
    const waUrl = getWhatsAppUrl({
      codigo: data.orden.id,
      fecha: data.orden.created_at,
      nombre: `${usuario.nombre} ${usuario.apellido}`,
      telefono: usuario.telefono,
      direccion: data.orden.direccion,
      razonSocial,
      cuit,
      items: data.items,
      total: data.orden.total,
    });

    window.open(waUrl, "_blank"); // Abrir la URL de WhatsApp en una nueva pestaña

    // Vaciar el carrito solo si la compra es desde el carrito
    if (source === "cart") {
      await clearCart();
      toast.success("Orden enviada a WhatsApp. Carrito vaciado.");
    } else {
      toast.success("Orden enviada a WhatsApp.");
    }

    onClose(); // Cerrar el modal después de enviar la orden
  };

  // Función para manejar el cambio en el input de CUIT/CUIL, aplicando formato dinámico y validación
  const handleCuitChange = (value: string) => {
    // Eliminar todo lo que NO sea número
    const limpio = value.replace(/\D/g, "");

    // No dejar más de 11 dígitos reales
    const max11 = limpio.slice(0, 11);

    // Aplicar formato dinámico XX-XXXXXXXX-X
    let formateado = max11;

    if (max11.length > 2 && max11.length <= 10) {
      formateado = `${max11.slice(0, 2)}-${max11.slice(2)}`;
    } 
    else if (max11.length === 11) {
      formateado = `${max11.slice(0, 2)}-${max11.slice(2, 10)}-${max11.slice(10)}`;
    }

    setCuit(formateado);
    limpiarError("cuit");
  };


  // Si no hay usuario, no renderizar el modal
  if (!usuario) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-2">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#003C71]">
            Comprar
          </h2>
          <button onClick={onClose} className="text-2xl hover:text-red-500">
            ✕
          </button>
        </div>

        {/* RAZÓN SOCIAL */}
        <label className="block font-semibold text-gray-700 mt-4">
          Razón Social
        </label>
        <select
          aria-label="Razon social"
          value={razonSocial}
          onChange={(e) => {
            setRazonSocial(e.target.value as any);
            limpiarError("razonSocial");
          }}
          className="border rounded p-2 w-full"
        >
          <option value="Consumidor Final">Consumidor Final</option>
          <option value="Responsable Inscripto">Responsable Inscripto</option>
        </select>

        {errores.razonSocial && (
          <p className="text-red-500 text-sm">{errores.razonSocial}</p>
        )}

        {/* CUIT */}
        <label className="block font-semibold text-gray-700 mt-4">
          CUIT / CUIL
        </label>
        <input
          aria-label="CUIT o CUIL"
          type="text"
          value={cuit}
          onChange={(e) => handleCuitChange(e.target.value)}
          className="w-full border rounded-md px-3 py-2"
          maxLength={13}
        />
        {errores.cuit && (
          <p className="text-red-600 text-sm mt-1">{errores.cuit}</p>
        )}

        <label className="block font-semibold text-gray-700 mt-4">
          Dirección
        </label>
        <UbicacionInput
          value={ubicacion}
          onSelect={(lugar) => {
            setUbicacion(lugar.display_name);
            setCoordenadas({ lat: lugar.lat, lon: lugar.lon });
            limpiarError("direccion")
          }}
        />
        {errores.direccion && (
          <p className="text-red-600 text-sm mt-1">{errores.direccion}</p>
        )}

        {/* TOTAL DEL PEDIDO */}
        <div className="text-right mb-4 mt-4">
          <p className="text-lg font-semibold">
            Total: ${(total).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          </p>
        </div>

        {/* AVISO IMPORTANTE */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">⚠️ Nota importante:</span> El precio mostrado no incluye los costos de envío. El total final se coordinará vía WhatsApp.
          </p>
          <p className="text-xs text-amber-800">
            <span className="font-semibold">*Envíos disponibles solo en Argentina. Para envíos a otro país contáctate por WhatsApp.</span>
          </p>
        </div>

        {/* BOTÓN */}
        <button
          onClick={confirmarCompra}
          className="mt-6 w-full bg-[#003C71] text-white py-2 rounded-md hover:bg-blue-900"
        >
          Confirmar compra
        </button>
        </div>
      </div>
    </div>
  );
}
