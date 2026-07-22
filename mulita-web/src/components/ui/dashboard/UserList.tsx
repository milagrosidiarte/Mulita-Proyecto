"use client";

import MenuAccionesUsuarios from "./MenuAccionesUsuarios";

interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rol: string;
  created_at: string;
  acceso_comunidad: boolean;
}

interface Props {
  usuarios: Usuario[];
  onUpdate: () => void; // callback para refrescar la lista de usuarios después de una acción (editar/eliminar/etc)
}

// Componente que renderiza la lista de usuarios en tarjetas
export default function UserList({ usuarios, onUpdate }: Props) {
  if (!usuarios?.length) {
    return <p className="text-gray-500">No se encontraron usuarios.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      {usuarios.map((u) => (
        <div
          key={u.id}
          className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow duration-200"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {u.nombre} {u.apellido}
              </h3>
              <p className="text-sm text-gray-600 mt-1">{u.email}</p>
            </div>
            {/* onUpdate se pasa tal cual al menú, así cualquier acción ahí dispara el refetch en el padre */}
            <div className="ml-4">
              <MenuAccionesUsuarios user={u} onUpdate={onUpdate} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Teléfono
              </p>
              <p className="text-sm text-gray-900 mt-1">{u.telefono}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Rol
              </p>
              <p className="text-sm text-gray-900 mt-1">
                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                  {u.rol}
                </span>
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Creado
              </p>
              <p className="text-sm text-gray-900 mt-1">
                {new Date(u.created_at).toLocaleDateString()}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Comunidad
              </p>
              <p className="text-sm text-gray-900 mt-1">
                <span
                  className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                    u.acceso_comunidad
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {u.acceso_comunidad ? "Sí" : "No"}
                </span>
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
