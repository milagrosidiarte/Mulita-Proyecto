import * as XLSX from "xlsx";

// Definición de la interfaz para los datos del usuario
interface UsuarioData {
  id: string;
  nombre: string;
  apellido?: string;
  email: string;
  rol: string;
  pais?: string;
  provincia?: string;
  ciudad?: string;
  institucion?: string;
  created_at?: string;
  eliminado?: boolean;
  [key: string]: any; // Para campos adicionales
}

export const exportUsuariosToExcel = (usuarios: UsuarioData[], filename = "usuarios.xlsx") => {
  // Mapear los datos para mostrar en el Excel
  const data = usuarios.map((usuario) => ({
    ID: usuario.id,
    "Nombre y Apellido": `${usuario.nombre || ""} ${usuario.apellido || ""}`.trim(), // Combina nombre y apellido, eliminando espacios extra
    Email: usuario.email,
    Rol: usuario.rol,
    País: usuario.pais || "Sin especificar",
    Provincia: usuario.provincia || "Sin especificar",
    Ciudad: usuario.ciudad || "Sin especificar",
    Institución: usuario.institucion || "Sin especificar",
    "Fecha de Creación": usuario.created_at
      ? new Date(usuario.created_at).toLocaleDateString("es-AR") // formatea la fecha si hay, como fecha argentina
      : "N/A",
  }));

  // Crear un nuevo workbook, lo convierte a hoja de excel
  const ws = XLSX.utils.json_to_sheet(data);

  // Ajustar el ancho de las columnas
  const colWidths = [
    { wch: 25 }, // ID
    { wch: 25 }, // Nombre y Apellido
    { wch: 25 }, // Email
    { wch: 15 }, // Rol
    { wch: 15 }, // País
    { wch: 18 }, // Provincia
    { wch: 18 }, // Ciudad
    { wch: 25 }, // Institución
    { wch: 18 }, // Fecha de Creación
  ];
  ws["!cols"] = colWidths;

  // Crear workbook y agregar la hoja llamada Usuarios
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Usuarios");

  // Descargar el archivo
  XLSX.writeFile(wb, filename);
};
