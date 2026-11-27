export default function AtalhosEscala({
  valorAtual,
  onChange,
  unidade = "g",
  presets = [],
  onPreset,
  chipHover = "",
}) {
  function aplicarMultiplicador(fator) {
    const num = parseFloat(String(valorAtual ?? "").replace(",", "."));
    if (!(num > 0)) return;
    const calculado = Number((num * fator).toFixed(4));
    onChange(String(calculado));
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
      <button
        type="button"
        onClick={() => aplicarMultiplicador(0.5)}
        className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 transition cursor-pointer ${chipHover}`}
        title="Reduzir batelada pela metade"
      >
        ×0,5
      </button>
      <button
        type="button"
        onClick={() => aplicarMultiplicador(2)}
        className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 transition cursor-pointer ${chipHover}`}
        title="Dobrar batelada"
      >
        ×2
      </button>
      {presets.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => (onPreset ? onPreset(p) : onChange(String(p)))}
          className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 transition cursor-pointer ${chipHover}`}
        >
          {p} {unidade}
        </button>
      ))}
    </div>
  );
}
