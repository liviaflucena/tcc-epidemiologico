import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function UFBarChart({ items }) {
  const sorted = [...(items || [])].sort((a,b) => (b.casos||0) - (a.casos||0)).slice(0,10);
  const labels = sorted.map(x => x.uf);
  const data = {
    labels,
    datasets: [
      { label: "Casos", data: sorted.map(x => x.casos||0) },
      { label: "Óbitos", data: sorted.map(x => x.obitos||0) },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" } },
    scales: { y: { beginAtZero: true } },
  };
  return (
    <div className="rounded-xl border border-zinc-200/70 dark:border-white/10 bg-white dark:bg-zinc-900 p-3 shadow-sm" style={{ height: 340 }}>
      <Bar data={data} options={options} />
    </div>
  );
}