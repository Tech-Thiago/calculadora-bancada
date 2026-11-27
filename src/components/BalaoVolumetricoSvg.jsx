import { useId } from "react";
import { ShieldAlert } from "lucide-react";

/**
 * Esquema SVG leve de balão volumétrico mostrando proporcionalmente
 * o volume de soluto/alíquota vs. solvente até a marca do menisco.
 */
export default function BalaoVolumetricoSvg({
  volumeSoluto = 0,
  volumeTotal = 0,
  unidade = "mL",
  acidoForte = false,
}) {
  const uid = useId().replace(/:/g, "");
  const clipId = `balao-interior-${uid}`;

  const total = Number(volumeTotal) > 0 ? Number(volumeTotal) : 1;
  const soluto = Math.max(0, Math.min(total, Number(volumeSoluto) || 0));
  const solvente = Math.max(0, total - soluto);
  const pctSolutoReal = (soluto / total) * 100;

  // Altura preenchida do fundo (y=106) até a marca do menisco no gargalo (y=38)
  const alturaTotal = 68;
  const yTopo = 38;
  const yFundo = 106;

  const pctSolutoVisual = soluto > 0 ? Math.max(7, Math.min(94, pctSolutoReal)) : 0;
  const pctSolventeVisual = 100 - pctSolutoVisual;

  const hSoluto = (pctSolutoVisual / 100) * alturaTotal;
  const hSolvente = (pctSolventeVisual / 100) * alturaTotal;

  function formatarVol(v) {
    if (v >= 10) return v.toFixed(1);
    if (v >= 1) return v.toFixed(2);
    return v.toFixed(3);
  }

  return (
    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/8 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Esquema no balão volumétrico
        </span>
        <span className="text-[11px] font-mono font-semibold text-cyan-700 dark:text-cyan-300">
          {pctSolutoReal.toFixed(2)}% v/v
        </span>
      </div>

      <div className="flex items-center gap-4">
        <svg
          viewBox="0 0 96 120"
          className="w-20 h-24 shrink-0 text-slate-400 dark:text-slate-500"
          role="img"
          aria-label="Diagrama proporcional do balão volumétrico"
        >
          <defs>
            <clipPath id={clipId}>
              <path d="M42 18 L54 18 L54 52 C68 58 76 72 76 86 C76 99 66 106 48 106 C30 106 20 99 20 86 C20 72 28 58 42 52 Z" />
            </clipPath>
          </defs>

          <g clipPath={`url(#${clipId})`}>
            {acidoForte ? (
              <>
                {/* 1º Água no fundo */}
                <rect
                  x="16"
                  y={yFundo - hSolvente}
                  width="64"
                  height={hSolvente}
                  className="fill-cyan-500/35 dark:fill-cyan-400/30 transition-all duration-300"
                />
                {/* 2º Ácido concentrado adicionado por cima */}
                <rect
                  x="16"
                  y={yTopo}
                  width="64"
                  height={hSoluto}
                  className="fill-amber-500/75 dark:fill-amber-400/70 transition-all duration-300"
                />
              </>
            ) : (
              <>
                {/* Solvente completando até o menisco */}
                <rect
                  x="16"
                  y={yTopo}
                  width="64"
                  height={hSolvente}
                  className="fill-sky-400/25 dark:fill-sky-400/20 transition-all duration-300"
                />
                {/* Soluto / alíquota */}
                <rect
                  x="16"
                  y={yFundo - hSoluto}
                  width="64"
                  height={hSoluto}
                  className="fill-cyan-600/70 dark:fill-cyan-400/70 transition-all duration-300"
                />
              </>
            )}
          </g>

          {/* Marca do menisco no gargalo */}
          <line
            x1="38"
            y1="38"
            x2="58"
            y2="38"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />

          {/* Indicador visual de adição pelas paredes em ácido forte */}
          {acidoForte && (
            <path
              d="M48 8 L48 26 M45 22 L48 26 L51 22"
              fill="none"
              className="stroke-amber-600 dark:stroke-amber-400"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Contorno do balão volumétrico */}
          <path
            d="M40 16 L56 16 M42 16 L42 52 C28 58 20 72 20 86 C20 99 30 106 48 106 C66 106 76 99 76 86 C76 72 68 58 54 52 L54 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div className="flex-1 min-w-0 space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  acidoForte ? "bg-amber-500" : "bg-cyan-600 dark:bg-cyan-400"
                }`}
              />
              {acidoForte ? "2º Ácido P.A." : "Alíquota / Soluto"}
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
              {formatarVol(soluto)} {unidade}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
              <span
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  acidoForte ? "bg-cyan-500/60" : "bg-sky-400/50"
                }`}
              />
              {acidoForte ? "1º Água (base + completar)" : "Solvente"}
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
              {formatarVol(solvente)} {unidade}
            </span>
          </div>

          <div className="pt-1.5 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Menisco final</span>
            <span className="font-mono font-semibold tabular-nums">
              {formatarVol(total)} {unidade}
            </span>
          </div>
        </div>
      </div>

      {acidoForte && (
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/12 border border-amber-500/25 text-[11px] font-medium text-amber-800 dark:text-amber-200">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <span>
            Ordem segura: adicione primeiro ~50% de água destilada no fundo do balão e verta o ácido lentamente pelas paredes.
          </span>
        </div>
      )}
    </div>
  );
}
