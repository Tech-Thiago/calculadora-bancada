const CORES_BARRA = [
  "bg-indigo-500",
  "bg-sky-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
];

export default function BarraProporcao({ titulo, segmentos = [] }) {
  if (!segmentos.length) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
        <span>{titulo}</span>
        <span className="font-mono text-[11px]">100%</span>
      </div>
      <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800/80 p-0.5 gap-1">
        {segmentos.map((seg, idx) => (
          <div
            key={seg.id || idx}
            style={{ width: `${Math.max(0, Math.min(100, seg.pct))}%` }}
            title={`${seg.nome}: ${seg.pct.toFixed(2)}%`}
            className={`${CORES_BARRA[idx % CORES_BARRA.length]} h-full rounded-full transition-all duration-300`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-0.5">
        {segmentos.map((seg, idx) => (
          <div key={seg.id || idx} className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <span className={`w-2.5 h-2.5 rounded-full ${CORES_BARRA[idx % CORES_BARRA.length]}`} />
            <span className="truncate max-w-[140px] font-medium">{seg.nome}</span>
            <span className="font-mono text-[11px] text-slate-400">{seg.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
