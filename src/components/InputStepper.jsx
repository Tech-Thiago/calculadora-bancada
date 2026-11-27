export default function InputStepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max,
  ariaLabel = "Margem de perda (%)",
}) {
  const atualNum = parseFloat(String(value ?? "").replace(",", "."));
  const valorValido = Number.isFinite(atualNum) ? atualNum : min;

  function ajustar(delta) {
    let proximo = valorValido + delta;
    if (typeof min === "number") proximo = Math.max(min, proximo);
    if (typeof max === "number") proximo = Math.min(max, proximo);
    proximo = Number(proximo.toFixed(4));
    onChange(String(proximo));
  }

  const desabilitarMenos = typeof min === "number" && valorValido <= min;
  const desabilitarMais = typeof max === "number" && valorValido >= max;

  return (
    <div className="flex items-stretch gap-1.5">
      <button
        type="button"
        onClick={() => ajustar(-step)}
        disabled={desabilitarMenos}
        aria-label={`Diminuir ${ariaLabel}`}
        className="min-w-[40px] px-2.5 rounded-xl bg-slate-100 dark:bg-[#1e2330] border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 font-mono text-base font-bold hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer select-none"
      >
        −
      </button>
      <input
        type="number"
        inputMode="decimal"
        step="any"
        min={min}
        max={max}
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full min-w-0 px-2.5 py-2.5 text-sm font-mono font-semibold text-center"
      />
      <button
        type="button"
        onClick={() => ajustar(step)}
        disabled={desabilitarMais}
        aria-label={`Aumentar ${ariaLabel}`}
        className="min-w-[40px] px-2.5 rounded-xl bg-slate-100 dark:bg-[#1e2330] border border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-200 font-mono text-base font-bold hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer select-none"
      >
        +
      </button>
    </div>
  );
}
