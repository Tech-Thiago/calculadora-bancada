import { useMemo, useState } from "react";
import { Scale, AlertTriangle, FlaskConical, Droplets, ArrowRightLeft } from "lucide-react";
import { SOLIDOS_SOLUCOES, LIQUIDOS_CONCENTRADOS } from "../data/reagentesSolucoes";
import {
  calcularSolucaoSolido,
  calcularSolucaoLiquido,
  calcularDiluicao,
} from "../utils/calculoSolucoes";
import FormulaQuimica from "../components/FormulaQuimica";
import AtalhosEscala from "../components/AtalhosEscala";
import BalaoVolumetricoSvg from "../components/BalaoVolumetricoSvg";
import { TEMAS_MODULO } from "../utils/temaModulos";
import { parseNumeroBr, sanitizarNumeroDecimal } from "../utils/numeroInput";

const tema = TEMAS_MODULO.solucoes;

export default function ModuloSolucoes({ onAbrirModoBalanca }) {
  const [submodo, setSubmodo] = useState("solido");

  const [solido, setSolido] = useState({
    formula: "NaOH",
    nome: "Hidróxido de Sódio",
    concentracao: "0.5",
    unidadeConc: "M",
    volume: "250",
    unidadeVol: "mL",
    purezaPct: "98",
    alertas: ["corrosivo", "higroscopico", "exotermico"],
  });

  const [liquido, setLiquido] = useState({
    formula: "HCl",
    nome: "Ácido Clorídrico P.A. (37%)",
    purezaPct: "37",
    densidade: "1.19",
    concentracao: "1.0",
    unidadeConc: "M",
    volume: "250",
    unidadeVol: "mL",
    acidoForte: true,
    alertas: ["corrosivo", "volatil", "usar_capela"],
  });

  const [diluicao, setDiluicao] = useState({
    nomeSolucao: "Solução Estoque",
    c1: "1.0",
    unidadeC1: "M",
    c2: "0.05",
    unidadeC2: "M",
    v2: "100",
    unidadeV2: "mL",
  });

  const resSolido = useMemo(
    () =>
      calcularSolucaoSolido({
        ...solido,
        concentracao: parseNumeroBr(solido.concentracao, 0),
        volume: parseNumeroBr(solido.volume, 0),
        purezaPct: parseNumeroBr(solido.purezaPct, 0),
      }),
    [solido]
  );
  const resLiquido = useMemo(
    () =>
      calcularSolucaoLiquido({
        ...liquido,
        purezaPct: parseNumeroBr(liquido.purezaPct, 0),
        densidade: parseNumeroBr(liquido.densidade, 0),
        concentracao: parseNumeroBr(liquido.concentracao, 0),
        volume: parseNumeroBr(liquido.volume, 0),
      }),
    [liquido]
  );
  const resDiluicao = useMemo(
    () =>
      calcularDiluicao({
        ...diluicao,
        c1: parseNumeroBr(diluicao.c1, 0),
        c2: parseNumeroBr(diluicao.c2, 0),
        v2: parseNumeroBr(diluicao.v2, 0),
      }),
    [diluicao]
  );

  function selecionarSolidoPreset(formula) {
    const achado = SOLIDOS_SOLUCOES.find((s) => s.formula === formula);
    if (!achado) return;
    setSolido((prev) => ({
      ...prev,
      formula: achado.formula,
      nome: achado.nome,
      purezaPct: String(achado.pureza),
      alertas: achado.alertas,
    }));
  }

  function selecionarLiquidoPreset(formula) {
    const achado = LIQUIDOS_CONCENTRADOS.find((l) => l.formula === formula);
    if (!achado) return;
    setLiquido((prev) => ({
      ...prev,
      formula: achado.formula,
      nome: achado.nome,
      purezaPct: String(achado.pureza),
      densidade: String(achado.densidade),
      acidoForte: achado.acidoForte,
      alertas: achado.alertas,
    }));
  }

  function abrirBalancaSolido() {
    if (!resSolido.valido) return;
    onAbrirModoBalanca({
      titulo: `Solução (${resSolido.formula})`,
      subtitulo: `${solido.concentracao} ${solido.unidadeConc} em ${solido.volume} ${solido.unidadeVol}`,
      itens: [
        {
          id: "soluto-solido",
          nome: `${resSolido.formula} — ${resSolido.nome}`,
          massaG: resSolido.massaPesarG,
          alertas: resSolido.alertas,
          detalhe: `Pureza ${resSolido.purezaPct.toFixed(1)}%${
            resSolido.massaMolar ? ` · MM ${resSolido.massaMolar.toFixed(2)} g/mol` : ""
          }`,
        },
      ],
    });
  }

  function abrirBalancaLiquido() {
    if (!resLiquido.valido) return;
    const usarUl = resLiquido.volumePipetarMl < 1;
    onAbrirModoBalanca({
      titulo: `Solução de Líquido P.A. (${resLiquido.formula})`,
      subtitulo: `${liquido.concentracao} ${liquido.unidadeConc} em ${liquido.volume} ${liquido.unidadeVol}`,
      itens: [
        {
          id: "soluto-liquido",
          nome: `${resLiquido.formula} — ${resLiquido.nome}`,
          valorDisplay: usarUl
            ? `${resLiquido.volumePipetarUl.toFixed(1)} µL`
            : `${resLiquido.volumePipetarMl.toFixed(3)} mL`,
          alertas: resLiquido.alertas,
          detalhe: `Equivalente em massa: ${resLiquido.massaEquivalenteG.toFixed(4)} g · Completar até ${resLiquido.volumeFinalMl.toFixed(1)} mL`,
        },
      ],
    });
  }

  function abrirBalancaDiluicao() {
    if (!resDiluicao.valido) return;
    onAbrirModoBalanca({
      titulo: `Diluição (C₁V₁ = C₂V₂)`,
      subtitulo: `Fator de diluição: ${resDiluicao.fatorDiluicao.toFixed(2)}x · Final: ${resDiluicao.v2} ${resDiluicao.unidadeV2}`,
      itens: [
        {
          id: "dil-estoque",
          nome: `${resDiluicao.nomeSolucao} (${diluicao.c1} ${diluicao.unidadeC1})`,
          valorDisplay: `${resDiluicao.v1.toFixed(3)} ${resDiluicao.unidadeV2}`,
          detalhe: "Alíquota da solução estoque",
        },
        {
          id: "dil-solvente",
          nome: "Solvente (completar volume)",
          valorDisplay: `${resDiluicao.vSolvente.toFixed(3)} ${resDiluicao.unidadeV2}`,
          detalhe: `Volume final: ${resDiluicao.v2} ${resDiluicao.unidadeV2} (${diluicao.c2} ${diluicao.unidadeC2})`,
        },
      ],
    });
  }

  return (
    <div className="space-y-5">
      {/* Seletor de submodo em pilulas */}
      <div className="bg-white p-2 rounded-full grid grid-cols-1 sm:grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={() => setSubmodo("solido")}
          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-xs sm:text-sm font-bold transition cursor-pointer ${
            submodo === "solido"
              ? tema.pillSubmodoAtiva
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
          }`}
        >
          <FlaskConical className="w-4 h-4" /> A partir de Sólido
        </button>

        <button
          type="button"
          onClick={() => setSubmodo("liquido")}
          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-xs sm:text-sm font-bold transition cursor-pointer ${
            submodo === "liquido"
              ? tema.pillSubmodoAtiva
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
          }`}
        >
          <Droplets className="w-4 h-4" /> Líquido Concentrado (P.A.)
        </button>

        <button
          type="button"
          onClick={() => setSubmodo("diluicao")}
          className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-full text-xs sm:text-sm font-bold transition cursor-pointer ${
            submodo === "diluicao"
              ? tema.pillSubmodoAtiva
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" /> Diluição (C₁V₁ = C₂V₂)
        </button>
      </div>

      {/* SUBMODO 1: SOLIDO */}
      {submodo === "solido" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          <section className="xl:col-span-7 bg-white p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900">Dados do soluto sólido</h3>
              {solido.formula.trim() && (
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${tema.headerBadge}`}>
                  <FormulaQuimica formula={solido.formula} />
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-7">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Base rápida</label>
                <select
                  value={SOLIDOS_SOLUCOES.some((s) => s.formula === solido.formula) ? solido.formula : ""}
                  onChange={(e) => selecionarSolidoPreset(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-medium"
                >
                  <option value="">— Fórmula manual —</option>
                  {SOLIDOS_SOLUCOES.map((s) => (
                    <option key={s.formula} value={s.formula}>
                      {s.formula} — {s.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-5">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Fórmula (MM automática)</label>
                <input
                  type="text"
                  value={solido.formula}
                  onChange={(e) => setSolido((p) => ({ ...p, formula: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm font-mono font-bold"
                />
              </div>

              <div className="sm:col-span-8">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nome</label>
                <input
                  type="text"
                  value={solido.nome}
                  onChange={(e) => setSolido((p) => ({ ...p, nome: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm font-medium"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Pureza (%)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={solido.purezaPct}
                  onChange={(e) =>
                    setSolido((p) => ({
                      ...p,
                      purezaPct: sanitizarNumeroDecimal(e.target.value),
                    }))
                  }
                  className="w-full px-3.5 py-2.5 text-sm font-mono font-semibold"
                />
              </div>

              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Concentração desejada</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={solido.concentracao}
                    onChange={(e) =>
                      setSolido((p) => ({
                        ...p,
                        concentracao: sanitizarNumeroDecimal(e.target.value),
                      }))
                    }
                    className="w-full px-3.5 py-2.5 text-sm font-mono font-semibold"
                  />
                  <select
                    value={solido.unidadeConc}
                    onChange={(e) => setSolido((p) => ({ ...p, unidadeConc: e.target.value }))}
                    className="px-3 py-2.5 text-xs font-bold"
                  >
                    <option value="M">mol/L (M)</option>
                    <option value="mM">mmol/L (mM)</option>
                    <option value="g/L">g/L</option>
                    <option value="% m/v">% m/v</option>
                    <option value="ppm">ppm</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Volume final</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={solido.volume}
                    onChange={(e) =>
                      setSolido((p) => ({
                        ...p,
                        volume: sanitizarNumeroDecimal(e.target.value),
                      }))
                    }
                    className="w-full px-3.5 py-2.5 text-sm font-mono font-semibold"
                  />
                  <select
                    value={solido.unidadeVol}
                    onChange={(e) => setSolido((p) => ({ ...p, unidadeVol: e.target.value }))}
                    className="px-3 py-2.5 text-xs font-bold"
                  >
                    <option value="mL">mL</option>
                    <option value="L">L</option>
                  </select>
                </div>
                <AtalhosEscala
                  valorAtual={solido.volume}
                  onChange={(val) => setSolido((p) => ({ ...p, volume: val }))}
                  onPreset={(val) => setSolido((p) => ({ ...p, volume: String(val), unidadeVol: "mL" }))}
                  unidade="mL"
                  presets={[100, 250, 500, 1000]}
                  chipHover={tema.chipHover}
                />
              </div>
            </div>
          </section>

          <div className="xl:col-span-5 xl:sticky xl:top-5">
            {!resSolido.valido ? (
              <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-sm font-medium">
                {resSolido.erro}
              </div>
            ) : (
              <aside className="bg-white p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Resultado</span>
                  <span className={`text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full border ${tema.headerBadge}`}>
                    <FormulaQuimica formula={resSolido.formula} />
                  </span>
                </div>

                <div className={`p-5 rounded-2xl ${tema.visorContainer}`}>
                  <span className={`text-[11px] font-mono font-bold uppercase tracking-wider ${tema.visorLabel}`}>
                    Pesar na balança
                  </span>
                  <div className="text-4xl font-mono font-extrabold tracking-tight text-slate-900 mt-1.5 tabular-nums">
                    {resSolido.massaPesarG.toFixed(4)}
                    <span className="text-lg font-semibold text-slate-400 ml-1.5">g</span>
                  </div>

                  <div className={`grid grid-cols-2 gap-3 mt-4 pt-4 border-t ${tema.visorDivisor}`}>
                    {resSolido.massaMolar && (
                      <div>
                        <span className="block text-[11px] font-medium text-slate-500">Massa molar</span>
                        <span className="text-sm font-mono font-bold text-slate-900 tabular-nums">
                          {resSolido.massaMolar.toFixed(2)} g/mol
                        </span>
                      </div>
                    )}
                    {resSolido.mols != null && (
                      <div>
                        <span className="block text-[11px] font-medium text-slate-500">Mols de soluto</span>
                        <span className="text-sm font-mono font-bold text-slate-900 tabular-nums">
                          {resSolido.mols.toFixed(5)} mol
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {resSolido.alertas?.length > 0 && (
                  <div className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 rounded-2xl">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> Alertas: {resSolido.alertas.join(" · ")}
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Roteiro de bancada</h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    {resSolido.roteiro.map((passo, idx) => (
                      <li key={idx}>{passo}</li>
                    ))}
                  </ol>
                </div>

                <button
                  type="button"
                  onClick={abrirBalancaSolido}
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold transition cursor-pointer ${tema.botaoPrimario}`}
                >
                  <Scale className="w-4 h-4" /> Abrir Modo Balança
                </button>
              </aside>
            )}
          </div>
        </div>
      )}

      {/* SUBMODO 2: LIQUIDO CONCENTRADO */}
      {submodo === "liquido" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          <section className="xl:col-span-7 bg-white p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900">Dados do líquido concentrado (P.A.)</h3>
              {liquido.formula.trim() && (
                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${tema.headerBadge}`}>
                  <FormulaQuimica formula={liquido.formula} />
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-7">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Reagente P.A.</label>
                <select
                  value={LIQUIDOS_CONCENTRADOS.some((l) => l.formula === liquido.formula) ? liquido.formula : ""}
                  onChange={(e) => selecionarLiquidoPreset(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-medium"
                >
                  <option value="">— Manual —</option>
                  {LIQUIDOS_CONCENTRADOS.map((l) => (
                    <option key={l.formula} value={l.formula}>
                      {l.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-5">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Fórmula</label>
                <input
                  type="text"
                  value={liquido.formula}
                  onChange={(e) => setLiquido((p) => ({ ...p, formula: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm font-mono font-bold"
                />
              </div>

              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Pureza (% m/m)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={liquido.purezaPct}
                  onChange={(e) =>
                    setLiquido((p) => ({
                      ...p,
                      purezaPct: sanitizarNumeroDecimal(e.target.value),
                    }))
                  }
                  className="w-full px-3.5 py-2.5 text-sm font-mono font-semibold"
                />
              </div>

              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Densidade (g/mL)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={liquido.densidade}
                  onChange={(e) =>
                    setLiquido((p) => ({
                      ...p,
                      densidade: sanitizarNumeroDecimal(e.target.value),
                    }))
                  }
                  className="w-full px-3.5 py-2.5 text-sm font-mono font-semibold"
                />
              </div>

              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Concentração alvo</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={liquido.concentracao}
                    onChange={(e) =>
                      setLiquido((p) => ({
                        ...p,
                        concentracao: sanitizarNumeroDecimal(e.target.value),
                      }))
                    }
                    className="w-full px-3.5 py-2.5 text-sm font-mono font-semibold"
                  />
                  <select
                    value={liquido.unidadeConc}
                    onChange={(e) => setLiquido((p) => ({ ...p, unidadeConc: e.target.value }))}
                    className="px-3 py-2.5 text-xs font-bold"
                  >
                    <option value="M">mol/L (M)</option>
                    <option value="mM">mmol/L (mM)</option>
                    <option value="g/L">g/L</option>
                    <option value="% m/v">% m/v</option>
                    <option value="% v/v">% v/v</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Volume final</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={liquido.volume}
                    onChange={(e) =>
                      setLiquido((p) => ({
                        ...p,
                        volume: sanitizarNumeroDecimal(e.target.value),
                      }))
                    }
                    className="w-full px-3.5 py-2.5 text-sm font-mono font-semibold"
                  />
                  <select
                    value={liquido.unidadeVol}
                    onChange={(e) => setLiquido((p) => ({ ...p, unidadeVol: e.target.value }))}
                    className="px-3 py-2.5 text-xs font-bold"
                  >
                    <option value="mL">mL</option>
                    <option value="L">L</option>
                  </select>
                </div>
                <AtalhosEscala
                  valorAtual={liquido.volume}
                  onChange={(val) => setLiquido((p) => ({ ...p, volume: val }))}
                  onPreset={(val) => setLiquido((p) => ({ ...p, volume: String(val), unidadeVol: "mL" }))}
                  unidade="mL"
                  presets={[100, 250, 500]}
                  chipHover={tema.chipHover}
                />
              </div>
            </div>
          </section>

          <div className="xl:col-span-5 xl:sticky xl:top-5">
            {!resLiquido.valido ? (
              <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-sm font-medium">
                {resLiquido.erro}
              </div>
            ) : (
              <aside className="bg-white p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Resultado</span>
                  <span className={`text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full border ${tema.headerBadge}`}>
                    <FormulaQuimica formula={resLiquido.formula} />
                  </span>
                </div>

                <div className={`p-5 rounded-2xl ${tema.visorContainer}`}>
                  <span className={`text-[11px] font-mono font-bold uppercase tracking-wider ${tema.visorLabel}`}>
                    Volume a pipetar
                  </span>
                  <div className="text-4xl font-mono font-extrabold tracking-tight text-slate-900 mt-1.5 tabular-nums">
                    {resLiquido.volumePipetarMl >= 1
                      ? resLiquido.volumePipetarMl.toFixed(3)
                      : resLiquido.volumePipetarUl.toFixed(1)}
                    <span className="text-lg font-semibold text-slate-400 ml-1.5">
                      {resLiquido.volumePipetarMl >= 1 ? "mL" : "µL"}
                    </span>
                  </div>

                  <div className={`grid grid-cols-2 gap-3 mt-4 pt-4 border-t ${tema.visorDivisor}`}>
                    <div>
                      <span className="block text-[11px] font-medium text-slate-500">Massa equivalente</span>
                      <span className="text-sm font-mono font-bold text-slate-900 tabular-nums">
                        {resLiquido.massaEquivalenteG.toFixed(4)} g
                      </span>
                    </div>
                    {resLiquido.molaridadeEstoque && (
                      <div>
                        <span className="block text-[11px] font-medium text-slate-500">Molaridade do frasco</span>
                        <span className="text-sm font-mono font-bold text-slate-900 tabular-nums">
                          {resLiquido.molaridadeEstoque.toFixed(2)} M
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {resLiquido.alertas?.length > 0 && (
                  <div className="flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3.5 py-2.5 rounded-2xl">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> Alertas: {resLiquido.alertas.join(" · ")}
                  </div>
                )}

                <BalaoVolumetricoSvg
                  volumeSoluto={resLiquido.volumePipetarMl}
                  volumeTotal={resLiquido.volumeFinalMl}
                  unidade="mL"
                  acidoForte={resLiquido.acidoForte}
                />

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Roteiro de pipetagem</h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    {resLiquido.roteiro.map((passo, idx) => (
                      <li key={idx}>{passo}</li>
                    ))}
                  </ol>
                </div>

                <button
                  type="button"
                  onClick={abrirBalancaLiquido}
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold transition cursor-pointer ${tema.botaoPrimario}`}
                >
                  <Scale className="w-4 h-4" /> Abrir Modo Balança
                </button>
              </aside>
            )}
          </div>
        </div>
      )}

      {/* SUBMODO 3: DILUICAO */}
      {submodo === "diluicao" && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          <section className="xl:col-span-7 bg-white p-6 space-y-5">
            <h3 className="text-sm font-bold text-slate-900">Parâmetros da diluição (C₁V₁ = C₂V₂)</h3>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-12">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nome da solução estoque</label>
                <input
                  type="text"
                  value={diluicao.nomeSolucao}
                  onChange={(e) => setDiluicao((p) => ({ ...p, nomeSolucao: e.target.value }))}
                  className="w-full px-3.5 py-2.5 text-sm font-medium"
                />
              </div>

              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Concentração inicial (C₁)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={diluicao.c1}
                    onChange={(e) =>
                      setDiluicao((p) => ({
                        ...p,
                        c1: sanitizarNumeroDecimal(e.target.value),
                      }))
                    }
                    className="w-full px-3.5 py-2.5 text-sm font-mono font-semibold"
                  />
                  <select
                    value={diluicao.unidadeC1}
                    onChange={(e) => setDiluicao((p) => ({ ...p, unidadeC1: e.target.value }))}
                    className="px-3 py-2.5 text-xs font-bold"
                  >
                    <option value="M">M</option>
                    <option value="mM">mM</option>
                    <option value="uM">µM</option>
                    <option value="g/L">g/L</option>
                    <option value="mg/L">mg/L</option>
                    <option value="ug/L">µg/L</option>
                    <option value="%">%</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-6">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Concentração final (C₂)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={diluicao.c2}
                    onChange={(e) =>
                      setDiluicao((p) => ({
                        ...p,
                        c2: sanitizarNumeroDecimal(e.target.value),
                      }))
                    }
                    className="w-full px-3.5 py-2.5 text-sm font-mono font-semibold"
                  />
                  <select
                    value={diluicao.unidadeC2}
                    onChange={(e) => setDiluicao((p) => ({ ...p, unidadeC2: e.target.value }))}
                    className="px-3 py-2.5 text-xs font-bold"
                  >
                    <option value="M">M</option>
                    <option value="mM">mM</option>
                    <option value="uM">µM</option>
                    <option value="g/L">g/L</option>
                    <option value="mg/L">mg/L</option>
                    <option value="ug/L">µg/L</option>
                    <option value="%">%</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-12">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Volume final desejado (V₂)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={diluicao.v2}
                    onChange={(e) =>
                      setDiluicao((p) => ({
                        ...p,
                        v2: sanitizarNumeroDecimal(e.target.value),
                      }))
                    }
                    className="w-full px-3.5 py-2.5 text-sm font-mono font-semibold"
                  />
                  <select
                    value={diluicao.unidadeV2}
                    onChange={(e) => setDiluicao((p) => ({ ...p, unidadeV2: e.target.value }))}
                    className="px-3 py-2.5 text-xs font-bold"
                  >
                    <option value="mL">mL</option>
                    <option value="L">L</option>
                    <option value="uL">µL</option>
                  </select>
                </div>
                <AtalhosEscala
                  valorAtual={diluicao.v2}
                  onChange={(val) => setDiluicao((p) => ({ ...p, v2: val }))}
                  onPreset={(val) => setDiluicao((p) => ({ ...p, v2: String(val), unidadeV2: "mL" }))}
                  unidade="mL"
                  presets={[50, 100, 250, 500]}
                  chipHover={tema.chipHover}
                />
              </div>
            </div>
          </section>

          <div className="xl:col-span-5 xl:sticky xl:top-5">
            {!resDiluicao.valido ? (
              <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-sm font-medium">
                {resDiluicao.erro}
              </div>
            ) : (
              <aside className="bg-white p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Resultado</span>
                  <span className={`text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full border ${tema.headerBadge}`}>
                    {resDiluicao.fatorDiluicao.toFixed(2)}x
                  </span>
                </div>

                <div className={`p-5 rounded-2xl ${tema.visorContainer}`}>
                  <span className={`text-[11px] font-mono font-bold uppercase tracking-wider ${tema.visorLabel}`}>
                    Alíquota estoque (V₁)
                  </span>
                  <div className="text-4xl font-mono font-extrabold tracking-tight text-slate-900 mt-1.5 tabular-nums">
                    {resDiluicao.v1.toFixed(3)}
                    <span className="text-lg font-semibold text-slate-400 ml-1.5">{resDiluicao.unidadeV2}</span>
                  </div>

                  <div className={`grid grid-cols-2 gap-3 mt-4 pt-4 border-t ${tema.visorDivisor}`}>
                    <div>
                      <span className="block text-[11px] font-medium text-slate-500">Solvente a completar</span>
                      <span className="text-sm font-mono font-bold text-slate-900 tabular-nums">
                        {resDiluicao.vSolvente.toFixed(3)} {resDiluicao.unidadeV2}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[11px] font-medium text-slate-500">Fator de diluição</span>
                      <span className="text-sm font-mono font-bold text-slate-900 tabular-nums">
                        {resDiluicao.fatorDiluicao.toFixed(2)}x
                      </span>
                    </div>
                  </div>
                </div>

                <BalaoVolumetricoSvg
                  volumeSoluto={resDiluicao.v1}
                  volumeTotal={resDiluicao.v2}
                  unidade={resDiluicao.unidadeV2}
                  acidoForte={false}
                />

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Roteiro de diluição</h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                    {resDiluicao.roteiro.map((passo, idx) => (
                      <li key={idx}>{passo}</li>
                    ))}
                  </ol>
                </div>

                <button
                  type="button"
                  onClick={abrirBalancaDiluicao}
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold transition cursor-pointer ${tema.botaoPrimario}`}
                >
                  <Scale className="w-4 h-4" /> Abrir Modo Balança
                </button>
              </aside>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
