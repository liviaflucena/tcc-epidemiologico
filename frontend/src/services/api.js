import axios from "axios";

const baseURL =
  import.meta.env.MODE === "development"
    ? (import.meta.env.VITE_API_URL || "http://localhost:8000")
    : "/api";

export const api = axios.create({ baseURL });

async function tryJson(promise, fallback = null) {
  try {
    const { data } = await promise;
    return data;
  } catch {
    return fallback;
  }
}

/** Estados */
export async function getStates() {
  return await tryJson(api.get("/states"), []);
}

/**
 * Agregação por UF (faz o mapa e o top 10)
 * GET /cases?agg=state[&year=YYYY][&month=MM]
 */
export async function getCasesAggState({ year, month } = {}) {
  const params = { agg: "state" };
  if (year)  params.year  = String(year);
  if (month) params.month = String(month).padStart(2, "0");
  return await tryJson(api.get("/cases", { params }), []);
}

/**
 * Série semanal por UF (linha e tabela)
 * GET /cases?agg=week&uf=XX[&year=YYYY][&month=MM]
 */
export async function getCasesByWeek(uf, { year, month } = {}) {
  const ufParam = Array.isArray(uf) ? uf[0] : uf;
  const params = { agg: "week", uf: ufParam };
  if (year)  params.year  = String(year);
  if (month) params.month = String(month).padStart(2, "0");
  return await tryJson(api.get("/cases", { params }), []);
}

/**
 * Agregação por município dentro da UF (se você usar em alguma tela)
 * GET /cases?agg=city&uf=XX[&year=YYYY][&month=MM]
 */
export async function getCasesByCity(uf, { year, month } = {}) {
  const params = { agg: "city", uf: (uf || "").toUpperCase() };
  if (year)  params.year  = String(year);
  if (month) params.month = String(month).padStart(2, "0");
  return await tryJson(api.get("/cases", { params }), []);
}

/** Typeahead via Solr com fallback para /states */
export async function searchUF(q) {
  // tentativa Solr direto (core "estados")
  try {
    const solrUrl = `${baseURL.replace(/\/$/, "")}/solr/estados/select`;
    const { data } = await axios.get(solrUrl, {
      params: {
        defType: "edismax",
        q,
        qf: "uf^3 nome",
        fl: "uf,nome,ibge_id",
        rows: 8,
        wt: "json",
      },
    });
    const docs = data?.response?.docs || [];
    return docs.map(d => ({ uf: d.uf, nome: d.nome, ibge_id: d.ibge_id }));
  } catch {
    // fallback: filtra client-side
    const states = await getStates();
    const qlower = q.toLowerCase();
    return (states || [])
      .filter(s => s.uf.toLowerCase().includes(qlower) || s.nome.toLowerCase().includes(qlower))
      .slice(0, 8);
  }
}
