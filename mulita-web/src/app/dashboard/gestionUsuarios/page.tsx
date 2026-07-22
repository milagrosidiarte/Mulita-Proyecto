"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import UserList from "../../../components/ui/dashboard/UserList";
import UserSearch from "../../../components/ui/UserSearch";
import Pagination from "../../../components/ui/dashboard/Pagination";
import { exportUsuariosToExcel } from "../../../lib/exportToExcel";

// Definimos la función para la página de gestión de usuarios, 
// que incluye la lista de usuarios, la funcionalidad de búsqueda, 
// filtrado por rol y exportación a Excel
export default function GestionUsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [rolFilter, setRolFilter] = useState<string>(""); // Nuevo filtro de rol
  const limit = 10;

  // Función para obtener los usuarios desde la API con paginación, búsqueda y filtrado por rol
  const fetchUsuarios = async () => {
    const params = new URLSearchParams({
      page: page.toString(), // Agregamos la página actual
      limit: limit.toString(), // Agregamos el límite de usuarios por página
      search, // Agregamos el término de búsqueda
      ...(rolFilter && { rol: rolFilter }), // Agregamos el filtro de rol si está seleccionado
    });
    const res = await fetch(`/api/usuarios?${params}`);
    const data = await res.json();
    setUsuarios(data.usuarios);
    setTotal(data.total);
  };

  // Función para exportar los usuarios a un archivo Excel, obteniendo todos los usuarios con los filtros actuales
  const handleExportToExcel = async () => {
    try {
      // Obtener todos los usuarios (sin paginación) con los filtros actuales desde el endpoint de exportación
      const params = new URLSearchParams({
        search,
        ...(rolFilter && { rol: rolFilter }),
      });
      const res = await fetch(`/api/usuarios/export?${params}`);
      const data = await res.json();
      
      console.log("Datos del usuario para exportar:", data.usuarios[0]); // Log para debugging
      
      if (data.usuarios && data.usuarios.length > 0) {
        // Generar un nombre de archivo único basado en la fecha y el filtro de rol
        const filename = `usuarios${rolFilter ? `_${rolFilter}` : ""}_${new Date().toLocaleDateString("es-AR").replace(/\//g, "-")}.xlsx`;
        exportUsuariosToExcel(data.usuarios, filename);
      }
    } catch (error) {
      console.error("Error al exportar a Excel:", error);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, [page, search, rolFilter]); // Llamamos a la función para traer los usuarios al montar el componente y cada vez que cambie la página, el término de búsqueda o el filtro de rol

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Gestión de Usuarios</h1>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <UserSearch search={search} setSearch={setSearch} />
        </div>
        
        <div className="sm:w-40">
          <select
            aria-label="filtro"
            value={rolFilter}
            onChange={(e) => {
              setRolFilter(e.target.value);
              setPage(1); // Resetear a página 1 al cambiar filtro
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            <option value="">Todos los roles</option>
            <option value="superAdmin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="docente">Docente</option>
            <option value="usuario">Usuario</option>
          </select>
        </div>

        <button
          onClick={handleExportToExcel}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors font-medium whitespace-nowrap"
        >
          <Download size={18} />
          Exportar Excel
        </button>
      </div>

      <UserList usuarios={usuarios} onUpdate={fetchUsuarios} />

      <Pagination
        page={page}
        setPage={setPage}
        total={total}
        limit={limit}
      />
    </div>
  );
}
