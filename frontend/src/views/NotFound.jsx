export default function NotFound() {
  return (
    <div className="card">
      <h1 className="text-xl font-semibold">404 — Página não encontrada</h1>
      <p className="mt-2 text-zinc-500">
        Verifique a URL ou volte ao <a href="/" className="underline">Dashboard</a>.
      </p>
    </div>
  );
}