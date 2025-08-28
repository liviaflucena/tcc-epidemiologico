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

/** Estados (fallback/local) */
export async function getStates() {
  return await tryJson(api.get("/states"), []);
}

/** Agregação por UF (usa /cases?agg=state) */
export async function getCasesAggState() {
  return await tryJson(api.get("/cases", { params: { agg: "state" } }), []);
}

/** Série semanal por UF (usa /cases?agg=week&uf=XX) */
export async function getCasesByWeek(uf) {
  return await tryJson(api.get("/cases", { params: { agg: "week", uf } }), []);
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
    // normaliza shape
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