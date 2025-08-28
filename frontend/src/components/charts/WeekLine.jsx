import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend,
} from "chart.js";
import { formatDateBR } from "../../services/format.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

export default function WeekLine({ points }) {
  const labels = points.map(p => formatDateBR(p.semana));
  const data = {
    labels,
    datasets: [
      {
        label: "Casos",
        data: points.map(p => p.casos),
        tension: 0.25,
        fill: false,
      },
      {
        label: "Óbitos",
        data: points.map(p => p.obitos),
        tension: 0.25,
        fill: false,
      },
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
      <Line data={data} options={options} />
    </div>
  );
}