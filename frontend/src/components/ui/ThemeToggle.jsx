import { useTheme } from "../../hooks/useTheme.jsx";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-2 rounded-md border border-zinc-200/70 dark:border-white/10 px-3 py-1.5 text-sm
                 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors"
      title="Alternar tema"
    >
      <span className="text-lg">{isDark ? "🌘" : "🌤️"}</span>
      <span>{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}