export default function YearSelect({ value, onChange, years }) {
  return (
    <div>
      <label className="label">Ano</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input"
      >
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  );
}