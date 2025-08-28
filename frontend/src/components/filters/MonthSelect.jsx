const meses = [
  ["", "Todos"],
  ["01", "Janeiro"],
  ["02", "Fevereiro"],
  ["03", "Março"],
  ["04", "Abril"],
  ["05", "Maio"],
  ["06", "Junho"],
  ["07", "Julho"],
  ["08", "Agosto"],
  ["09", "Setembro"],
  ["10", "Outubro"],
  ["11", "Novembro"],
  ["12", "Dezembro"],
];

export default function MonthSelect({ value, onChange }) {
  return (
    <div>
      <label className="label">Mês</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input"
      >
        {meses.map(([v, t]) => (
          <option key={v || "all"} value={v}>{t}</option>
        ))}
      </select>
    </div>
  );
}