import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { searchUF, getStates } from "../../services/api.js";

/** Typeahead que consulta Solr e tem fallback local */
export default function UFTypeahead({ value, onSelect }) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState([]);
  const boxRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  useEffect(() => { setQuery(value || ""); }, [value]);

  async function onChange(e) {
    const q = e.target.value;
    setQuery(q);
    if (q.length < 1) { setOpen(false); setOpts([]); return; }
    setOpen(true);

    // tenta Solr primeiro; se falhar, usa /states
    let list = await searchUF(q);
    if (!Array.isArray(list) || list.length === 0) {
      const states = await getStates();
      const qlower = q.toLowerCase();
      list = (states || []).filter(s =>
        s.uf.toLowerCase().includes(qlower) || s.nome.toLowerCase().includes(qlower)
      ).slice(0, 8);
    }
    setOpts(list);
  }

  function choose(item) {
    onSelect?.(item.uf);
    setQuery(item.uf);
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative">
      <label className="label">UF</label>
      <input
        value={query}
        onChange={onChange}
        onFocus={() => { if (opts.length) setOpen(true); }}
        placeholder="Digite a UF ou o nome do estado…"
        className="input"
      />
      {open && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-zinc-200/60 dark:border-white/10 bg-white dark:bg-zinc-900 shadow">
          {opts.length === 0 && (
            <div className="px-3 py-2 text-sm text-zinc-900">Sem resultados</div>
          )}
          {opts.map((it) => (
            <button
              key={it.uf}
              onClick={() => choose(it)}
              className={clsx(
                "w-full text-left px-3 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-white/5"
              )}
            >
              <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-white/10 mr-2">
                {it.uf}
              </span>
              {it.nome}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}