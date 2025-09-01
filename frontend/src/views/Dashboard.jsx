import { useEffect, useMemo, useState } from "react";
import Card from "../components/ui/Card.jsx";
import UFTypeahead from "../components/filters/UFTypeahead.jsx";
import YearSelect from "../components/filters/YearSelect.jsx";
import MonthSelect from "../components/filters/MonthSelect.jsx";
import WeekLine from "../components/charts/WeekLine.jsx";
import UFBarChart from "../components/charts/UFBarChart.jsx";
import { getCasesAggState, getCasesByWeek } from "../services/api.js";
import { formatDateBR } from "../services/format.js";
import BrazilChoroplethRSM from "../components/BrazilChoroplethRSM.jsx";


export default function Dashboard() {
  const [uf, setUf] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState("");

  const [aggState, setAggState] = useState([]);
  const [weekSeries, setWeekSeries] = useState([]);

  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return [String(y - 1), String(y)];
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const data = await getCasesAggState({ year, month });
      if (!alive) return;
      setAggState(Array.isArray(data) ? data : [year, month]);
    })();
    return () => { alive = false; };
  }, [year, month]);

  useEffect(() => {
    if (!uf) { setWeekSeries([]); return; }
    let alive = true;
    (async () => {
      const data = await getCasesByWeek(uf, { year, month } );
      let rows = Array.isArray(data) ? data : [];
      if (year) rows = rows.filter(r => String(r.semana).slice(0,4) === year);
      if (month) rows = rows.filter(r => String(r.semana).slice(5,7) === month);
      if (!alive) return;
      setWeekSeries(rows.map(r => ({
        semana: String(r.semana), // formatamos só na renderização
        casos: Number(r.casos)||0,
        obitos: Number(r.obitos)||0
      })));
    })();
    return () => { alive = false; };
  }, [uf, year, month]);

  const kpi = useMemo(() => {
    if (!uf) {
      const totalCasos = aggState.reduce((s, x) => s + (x.casos || 0), 0);
      const totalObitos = aggState.reduce((s, x) => s + (x.obitos || 0), 0);
      return { totalCasos, totalObitos, label: "Brasil" };
    }
    const totalCasos = weekSeries.reduce((s, x) => s + (x.casos || 0), 0);
    const totalObitos = weekSeries.reduce((s, x) => s + (x.obitos || 0), 0);
    return { totalCasos, totalObitos, label: uf };
  }, [aggState, weekSeries, uf]);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <UFTypeahead value={uf} onSelect={setUf} />
        <YearSelect value={year} onChange={setYear} years={years} />
        <MonthSelect value={month} onChange={setMonth} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card title={`Casos — ${kpi.label}`} value={kpi.totalCasos.toLocaleString("pt-BR")} />
        <Card title={`Óbitos — ${kpi.label}`} value={kpi.totalObitos.toLocaleString("pt-BR")} />
        <Card title="Série filtrada" value={`${weekSeries.length} semanas`} sub={uf ? `UF ${uf} • ${year}${month ? " / "+month : ""}` : "Selecione uma UF"} />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <div className="mb-3 text-sm text-zinc-900 dark:text-zinc-400">Top 10 UFs — Casos e Óbitos</div>
          <UFBarChart items={aggState} />
        </section>

        <section>
          <div className="mb-3 text-sm text-zinc-900 dark:text-zinc-400">
            {uf ? `Série semanal — ${uf}${month ? " • mês "+month : ""} • ${year}` : "Selecione uma UF para ver a série semanal"}
          </div>
          <WeekLine points={weekSeries} />
        </section>
      </div>

      {/* Tabela */}
      {uf && weekSeries.length > 0 && (
        <section className="rounded-xl border border-zinc-200/70 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 shadow-sm overflow-x-auto">
          <div className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">Semanas — {uf} ({year}{month? " / "+month : ""})</div>
          <table className="min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-zinc-500 dark:text-zinc-400 border-b border-zinc-200/60 dark:border-white/10">
                <th className="py-2 pr-4">Semana</th>
                <th className="py-2 pr-4">Casos</th>
                <th className="py-2 pr-4">Óbitos</th>
              </tr>
            </thead>
            <tbody>
              {weekSeries.map((r) => (
                <tr key={r.semana} className="border-b border-zinc-100/60 dark:border-white/5">
                  <td className="py-2 pr-4">{formatDateBR(r.semana)}</td>
                  <td className="py-2 pr-4">{r.casos.toLocaleString("pt-BR")}</td>
                  <td className="py-2 pr-4">{r.obitos.toLocaleString("pt-BR")}</td>
                </tr>
              ))}
              
            </tbody>
            
          </table>
        </section>
        
             

        
        
      )}
      {/* Mapa coroplético por estado */}
  <section className="rounded-xl border border-zinc-200/70 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 shadow-sm">
    <div className="mb-3 text-sm text-zinc-900 dark:text-zinc-400">
      Distribuição de Casos Totais por Estado
    </div>
    <div style={{ width: "100%", height: "600px" }}>
      <BrazilChoroplethRSM
    items={aggState}        // vem do getCasesAggState({ year, month })
    selectedUf={uf}
    onSelectUf={setUf}      // clique no mapa muda a UF dos demais gráficos/tabela
    height="600px"
    // breaks={[0, 100, 500, 1000, 5000, 10000]} // opcional
     colors={["#f2f0f7","#dadaeb","#bcbddc","#9e9ac8","#756bb1","#54278f"]} // opcional
  />
    </div>
  </section>
    </div>
  );
}