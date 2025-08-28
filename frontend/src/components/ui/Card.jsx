export default function Card({ title, value, sub }) {
  return (
    <div className="rounded-xl border border-zinc-200/70 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 shadow-sm">
      {title && <div className="text-sm text-zinc-500 dark:text-zinc-400">{title}</div>}
      {value !== undefined && <div className="mt-1 text-2xl font-semibold">{value}</div>}
      {sub && <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{sub}</div>}
    </div>
  );
}