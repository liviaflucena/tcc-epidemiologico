export function formatDateBR(iso) {
  // aceita "2025-02-10", "2025-02-10T00:00:00Z" ou "Mon, 10 Feb 2025 00:00:00 GMT"
  try {
    const d = new Date(iso);
    if (isNaN(d)) return String(iso);
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const yyyy = d.getUTCFullYear();
    return `${dd}/${mm}/${yyyy}`;
  } catch {
    return String(iso);
  }
}