import { useMemo } from "react";

export default function useChartColors(isDark) {
  return useMemo(() => {
    const colors = isDark
      ? {
          // dark
          text: "#e5e7eb",      // zinc-200
          grid: "#3f3f46",      // zinc-700
          primary: "#60a5fa",   // blue-400
          primaryFill: "rgba(40, 118, 212, 0.49)",
          secondary: "#0a4df5ff", // violet-400
          secondaryFill: "rgba(20, 35, 151, 0.47)",
          bars1: "#22aaeeff",     // cyan-400
          bars2: "#9972f4ff",     // pink-400
        }
      : {
          // light
          text: "#0a0a0a",      // near black
          grid: "#e4e4e7",      // zinc-200
          primary: "#2563eb",   // blue-600
          primaryFill: "rgba(37,99,235,0.15)",
          secondary: "#7c3aed", // violet-600
          secondaryFill: "rgba(124,58,237,0.12)",
          bars1: "#0ea5e9",     // sky-500
          bars2: "#ef4444",     // red-500
        };

    const optionsBase = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: colors.text } },
        tooltip: {
          titleColor: colors.text,
          bodyColor: colors.text,
        },
      },
      scales: {
        x: {
          grid: { color: colors.grid },
          ticks: { color: colors.text },
        },
        y: {
          grid: { color: colors.grid },
          ticks: { color: colors.text },
          beginAtZero: true,
        },
      },
    };

    return { colors, optionsBase };
  }, [isDark]);
}