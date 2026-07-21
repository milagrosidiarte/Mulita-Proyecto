interface Props {
  search: string; // valor actual del input de búsqueda
  setSearch: (value: string) => void; // función para actualizar el valor del input de búsqueda
}
// 
export default function UserSearch({ search, setSearch }: Props) { // se crea el componente y se extraen las props directamente del objeto recibido
  return (
    <input
      type="text"
      value={search} // se asigna el valor del input al valor de la prop search
      onChange={(e) => setSearch(e.target.value)} // actualiza el estado del texto cada vez que el usuario escribe
      placeholder="Buscar por nombre..."
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
    />
  );
}

// el componente es reutilizable porque no guarda su propio estado, depende de quien lo use.