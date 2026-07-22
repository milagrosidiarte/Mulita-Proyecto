interface Props {
  page: number;
  setPage: (p: number) => void; // el componente no maneja el estado de la página, sino que lo recibe como prop y lo actualiza mediante la función setPage
  total: number;
  limit: number;
}

export default function Pagination({ page, setPage, total, limit }: Props) {
  const totalPages = Math.ceil(total / limit); // Calcula el número total de páginas redondeando hacia arriba

  return (
    <div className="flex justify-center gap-2 mt-4">
      <button 
        disabled={page === 1} // Deshabilita el botón si estamos en la primera página
        onClick={() => setPage(page - 1)}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Anterior
      </button>

      <span className="px-3 py-1">
        Página {page} de {totalPages || 1} {/* Muestra la página actual y el total de páginas, asegurando que al menos se muestre 1 si totalPages es 0 */}
      </span>

      <button
        disabled={page === totalPages}
        onClick={() => setPage(page + 1)} // Deshabilita el botón si estamos en la última página
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Siguiente
      </button>
    </div>
  );
}
