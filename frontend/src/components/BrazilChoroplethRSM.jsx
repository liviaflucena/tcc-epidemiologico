import { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleThreshold } from "d3-scale";

export default function BrazilChoroplethRSM({
  items = [],
  breaks = [0, 500, 1000, 2500, 5000, 10000],
  colors = ["#f2f0f7","#dadaeb","#bcbddc","#9e9ac8","#756bb1","#54278f"],
  height = "600px",
  geographyPath = "/br-states.geojson",
  selectedUf = "",
  onSelectUf = () => {},         // <- novo
  dimOthers = true,                // <- opcional
}) {
  const [hover, setHover] = useState(null);

  // Mapa: UF -> total de casos
  const casesByUF = useMemo(() => {
    const m = new Map();
    for (const r of items) {
      const uf = (r.uf || "").toUpperCase();
      const total = Number(r.casos) || 0;
      if (uf) m.set(uf, total);
    }
    return m;
  }, [items]);

  // Escala de cores (threshold/step). Usa os cortes internos (sem o primeiro).
  const colorScale = useMemo(
    () => scaleThreshold().domain(breaks.slice(1)).range(colors),
    [breaks, colors]
  );

  return (
    <div className="relative w-full" style={{ height }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 650, center: [-53, -15] }}
        style={{ width: "100%", height: "100%" }}
      >
        <Geographies geography={geographyPath}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const uf = (geo.id || "").toUpperCase();
              const nome = geo.properties?.nome || uf || "";
              const val = casesByUF.get(uf) ?? 0;
              const fill = colorScale(val) || colors[0];

              const isSelected =
                selectedUf && uf === String(selectedUf).toUpperCase();
              const faded = dimOthers && selectedUf && !isSelected;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={() => setHover({ nome, uf, val })}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => onSelectUf(uf)}
                  style={{
                    background: "rounded-xl border border-zinc-200/70 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 shadow-sm",
                    default: {
                      fill,
                      background: "rounded-xl border border-zinc-200/70 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 shadow-sm",
                      outline: "none",
                      stroke: isSelected ? "#111" : "#333",
                      strokeWidth: isSelected ? 1.2 : 0.5,
                      opacity: faded ? 0.45 : 1,
                      cursor: "pointer",
                    },
                    hover: {
                      fill,
                      background: "rounded-xl border border-zinc-200/70 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 shadow-sm",
                      outline: "none",
                      stroke: "#111",
                      strokeWidth: 0.8,
                      opacity: 1,
                      cursor: "pointer",
                    },
                    pressed: { fill, outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Legenda */}
      <div
        className="absolute left-4 bottom-4 rounded-xl shadow-md"
        style={{
          background: "rounded-xl border border-zinc-200/70 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 shadow-sm",
          padding: "10px 12px",
          fontSize: 12,
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 8, background: "rounded-xl border border-zinc-200/70 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 shadow-sm"}}>Casos (faixas)</div>
        {breaks.map((from, i) => {
          const to = breaks[i + 1];
          const label =
            to !== undefined
              ? `${from.toLocaleString("pt-BR")}–${to.toLocaleString("pt-BR")}`
              : `${from.toLocaleString("pt-BR")}+`;
          return (
            <div
              key={i}
              style={{
                background: "rounded-xl border border-zinc-200/70 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 shadow-sm",
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <span
                style={{
                    background: "rounded-xl border border-zinc-200/70 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 shadow-sm",
                  width: 16,
                  height: 12,
                  borderRadius: 3,
                 
                  display: "inline-block",
                }}
              />
              <span>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {hover && (
        <div
          className="absolute left-4 top-4 rounded-lg shadow"
          style={{
            background: "rounded-xl border border-zinc-200/70 dark:border-white/10 bg-white dark:bg-zinc-900 p-4 shadow-sm",
            padding: "8px 10px",
            fontSize: 12,
            fontFamily:
              "system-ui, -apple-system, Segoe UI, Roboto, Inter, sans-serif",
          }}
        >
          <strong>
            {hover.nome} ({hover.uf})
          </strong>
          <br />
          Casos: {Number(hover.val || 0).toLocaleString("pt-BR")}
        </div>
      )}
    </div>
  );
}