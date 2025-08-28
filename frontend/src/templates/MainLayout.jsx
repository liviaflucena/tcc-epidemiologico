import ThemeToggle from "../components/ui/ThemeToggle.jsx";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 transition-colors">
      <header className="border-b border-zinc-200/60 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur">
        <div className="container-max py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-indigo-600 text-white grid place-items-center font-bold shadow">
              DE
            </div>
            <div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">TCC</div>
              <div className="text-lg font-semibold">Dashboard Epidemiológico</div>
            </div>
          </a>
          <nav className="flex items-center gap-3 text-sm">
            <a href="/" className="hover:underline">Dashboard</a>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="container-max py-6">{children}</main>

      <footer className="container-max py-8 text-xs text-zinc-500 dark:text-zinc-400">
        Dados: API Flask • Busca UF: Solr • UI: Tailwind • Gráficos: Chart.js
      </footer>
    </div>
  );
}