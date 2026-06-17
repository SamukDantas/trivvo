export default function EstadoCarregando() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse rounded-xl border border-zinc-200 bg-white p-5">
          <div className="mb-4 h-40 rounded-lg bg-zinc-200" />
          <div className="mb-2 h-4 w-20 rounded bg-zinc-200" />
          <div className="mb-2 h-5 w-3/4 rounded bg-zinc-200" />
          <div className="h-4 w-1/3 rounded bg-zinc-200" />
        </div>
      ))}
    </div>
  );
}
