import { useMemo, useState } from "react";

function normalizar(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Campo de busca com sugestões instantâneas.
 * opcoes: [{ id, titulo, subtitulo, chavePrincipal, busca, dados }]
 */
export default function AutocompleteInput({
  value,
  onChange,
  onSelect,
  opcoes = [],
  placeholder = "Digite para buscar...",
  className = "",
  maxResultados = 8,
}) {
  const [aberto, setAberto] = useState(false);

  const filtradas = useMemo(() => {
    const termo = normalizar(value);
    if (!termo) return opcoes.slice(0, maxResultados);

    const comScore = [];
    for (const op of opcoes) {
      const principal = normalizar(op.chavePrincipal || op.titulo);
      const busca = normalizar(op.busca || `${op.titulo} ${op.subtitulo || ""}`);

      if (principal === termo) {
        comScore.push({ op, score: 0 });
      } else if (principal.startsWith(termo)) {
        comScore.push({ op, score: 1 });
      } else if (busca.startsWith(termo)) {
        comScore.push({ op, score: 2 });
      } else if (busca.includes(termo)) {
        comScore.push({ op, score: 3 });
      }
    }

    comScore.sort((a, b) => a.score - b.score);
    return comScore.slice(0, maxResultados).map((item) => item.op);
  }, [value, opcoes, maxResultados]);

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onFocus={() => setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 120)}
        onChange={(e) => {
          onChange(e.target.value);
          setAberto(true);
        }}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />

      {aberto && filtradas.length > 0 && (
        <div className="absolute z-40 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg divide-y divide-slate-100 dark:divide-zinc-800">
          {filtradas.map((op) => (
            <button
              key={op.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(op.dados);
                setAberto(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center justify-between gap-2 cursor-pointer"
            >
              <span className="text-sm font-semibold text-slate-900 dark:text-zinc-100 truncate">
                {op.titulo}
              </span>
              {op.subtitulo && (
                <span className="text-xs text-slate-500 dark:text-zinc-400 shrink-0 font-mono">
                  {op.subtitulo}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
