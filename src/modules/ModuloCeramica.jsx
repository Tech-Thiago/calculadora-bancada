import { useMemo, useState } from "react";
import { Scale, AlertTriangle } from "lucide-react";
import { PRECURSORES_CERAMICOS, ELEMENTOS_INFO } from "../data/tabelaPeriodica";
import { parseFormula } from "../utils/formulaParser";
import { calcularSinteseCeramica } from "../utils/calculoCeramica";
import AutocompleteInput from "../components/AutocompleteInput";
import BarraProporcao from "../components/BarraProporcao";

const EXEMPLOS_CERAMICA = [
  { nome: "Titanato de Bário (BaTiO3)", formula: "BaTiO3", massa: "10" },
  { nome: "Zircônia 8YSZ (Zr0.852Y0.148O1.926)", formula: "Zr0.852Y0.148O1.926", massa: "15" },
  { nome: "Ferrita de Zinco (ZnFe2O4)", formula: "ZnFe2O4", massa: "10" },
  { nome: "KNN (K0.5Na0.5NbO3)", formula: "K0.5Na0.5NbO3", massa: "10" },
];

const OPCOES_ELEMENTOS = ELEMENTOS_INFO.map((el) => ({
  id: el.simbolo,
  chavePrincipal: el.simbolo,
  titulo: `${el.simbolo} — ${el.nome}`,
  subtitulo: `${el.massa} g/mol`,
  busca: `${el.simbolo} ${el.nome} ${el.nomeEn}`,
  dados: el,
}));

function escolherPrecursorPadrao(elemento) {
  const achado = PRECURSORES_CERAMICOS.find((p) => {
    const parsed = parseFormula(p.formula);
    return parsed.valido && elemento in parsed.elementos;
  });
  return achado || { formula: "", nome: `Precursor de ${elemento}`, pureza: 99.0, alertas: [] };
}

export default function ModuloCeramica({ onAbrirModoBalanca }) {
  const [formulaAlvo, setFormulaAlvo] = useState("BaTiO3");
  const [massaAlvoG, setMassaAlvoG] = useState("10");
  const [perdaPct, setPerdaPct] = useState("0");
  const [precursoresPorEl, setPrecursoresPorEl] = useState({});

  const [dopagem, setDopagem] = useState({
    modo: "nenhuma",
    elementoDopante: "La",
    elementoSubstituido: "Ba",
    porcentagemMol: "2",
    precursorFormula: "La2O3",
    precursorNome: "Óxido de Lantânio",
    purezaPct: "99.9",
    alertas: ["higroscopico", "secar_estufa"],
  });

  const parsedAlvo = useMemo(() => parseFormula(formulaAlvo), [formulaAlvo]);

  const cationsDetectados = useMemo(() => {
    if (!parsedAlvo.valido) return [];
    return Object.keys(parsedAlvo.elementos).filter((el) => el !== "O");
  }, [parsedAlvo]);

  const mapaPrecursores = useMemo(() => {
    const mapa = {};
    for (const el of cationsDetectados) {
      if (precursoresPorEl[el]) {
        mapa[el] = precursoresPorEl[el];
      } else {
        const padrao = escolherPrecursorPadrao(el);
        mapa[el] = {
          formula: padrao.formula,
          nome: padrao.nome,
          purezaPct: String(padrao.pureza),
          alertas: padrao.alertas || [],
        };
      }
    }
    return mapa;
  }, [cationsDetectados, precursoresPorEl]);

  const elementoSubEfetivo = cationsDetectados.includes(dopagem.elementoSubstituido)
    ? dopagem.elementoSubstituido
    : cationsDetectados[0] || "";

  function atualizarPrecursor(elemento, campo, valor) {
    setPrecursoresPorEl((prev) => {
      const atual = prev[elemento] || mapaPrecursores[elemento];
      return { ...prev, [elemento]: { ...atual, [campo]: valor } };
    });
  }

  function selecionarPresetPrecursor(elemento, formulaPrecursor) {
    const achado = PRECURSORES_CERAMICOS.find((p) => p.formula === formulaPrecursor);
    if (!achado) return;
    setPrecursoresPorEl((prev) => ({
      ...prev,
      [elemento]: {
        formula: achado.formula,
        nome: achado.nome,
        purezaPct: String(achado.pureza),
        alertas: achado.alertas || [],
      },
    }));
  }

  function selecionarDopante(simbolo) {
    const padrao = escolherPrecursorPadrao(simbolo);
    setDopagem((prev) => ({
      ...prev,
      elementoDopante: simbolo,
      precursorFormula: padrao.formula || prev.precursorFormula,
      precursorNome: padrao.nome || `Precursor de ${simbolo}`,
      purezaPct: String(padrao.pureza ?? 99.5),
      alertas: padrao.alertas || [],
    }));
  }

  const resultado = useMemo(() => {
    return calcularSinteseCeramica({
      formulaAlvo,
      massaAlvoG: parseFloat(massaAlvoG) || 0,
      perdaPct: parseFloat(perdaPct) || 0,
      precursores: cationsDetectados.map((el) => ({
        cation: el,
        formula: mapaPrecursores[el]?.formula || "",
        nome: mapaPrecursores[el]?.nome || el,
        purezaPct: parseFloat(mapaPrecursores[el]?.purezaPct) || 100,
        alertas: mapaPrecursores[el]?.alertas || [],
      })),
      dopagem: {
        ...dopagem,
        elementoSubstituido: elementoSubEfetivo,
      },
    });
  }, [formulaAlvo, massaAlvoG, perdaPct, cationsDetectados, mapaPrecursores, dopagem, elementoSubEfetivo]);

  function handleModoBalanca() {
    if (!resultado.valido) return;
    onAbrirModoBalanca({
      titulo: `Síntese Cerâmica (${formulaAlvo})`,
      subtitulo: `Produto alvo: ${resultado.massaPrepAlvoG.toFixed(4)} g · Precursores: ${resultado.massaTotalPrecursoresG.toFixed(4)} g`,
      itens: resultado.itens.map((item, idx) => ({
        id: `${item.cation}-${idx}`,
        nome: `${item.formula} — ${item.nome}${item.ehDopante ? " (Dopante)" : ""}`,
        massaG: item.massaPesarG,
        alertas: item.alertas,
        detalhe: `Fornece ${item.cation} · Pureza ${item.purezaPct}% · ${item.molsPrecursor.toFixed(5)} mol`,
      })),
    });
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
      {/* COLUNA ESQUERDA */}
      <div className="xl:col-span-7 space-y-5">
        <section className="bg-white p-6 space-y-5">
          <h3 className="text-sm font-bold text-slate-900">Fase cerâmica alvo</h3>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-6">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                Fórmula química (aceita decimais)
              </label>
              <input
                type="text"
                value={formulaAlvo}
                onChange={(e) => setFormulaAlvo(e.target.value)}
                placeholder="Ex: BaTiO3, Zr0.852Y0.148O1.926"
                className="w-full px-3.5 py-2.5 text-sm font-mono font-bold"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Massa alvo (g)</label>
              <input
                type="number"
                step="any"
                min="0"
                value={massaAlvoG}
                onChange={(e) => setMassaAlvoG(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-mono font-semibold"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Perda (%)</label>
              <input
                type="number"
                step="any"
                min="0"
                value={perdaPct}
                onChange={(e) => setPerdaPct(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-mono font-semibold"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-xs font-medium text-slate-400 mr-1">Exemplos:</span>
            {EXEMPLOS_CERAMICA.map((ex) => (
              <button
                key={ex.formula}
                type="button"
                onClick={() => {
                  setFormulaAlvo(ex.formula);
                  setMassaAlvoG(ex.massa);
                }}
                className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-indigo-500/15 hover:text-indigo-600 dark:hover:text-indigo-300 transition cursor-pointer"
              >
                {ex.nome}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Precursores por cátion ({cationsDetectados.length})
            </h3>
            <span className="text-xs text-slate-400">O₂ balanceado automaticamente</span>
          </div>

          {!parsedAlvo.valido ? (
            <p className="text-sm text-amber-600 dark:text-amber-300">{parsedAlvo.erro}</p>
          ) : (
            <div className="space-y-3">
              {cationsDetectados.map((el) => {
                const prec = mapaPrecursores[el];
                const opcoesCompativeis = PRECURSORES_CERAMICOS.filter((p) => {
                  const r = parseFormula(p.formula);
                  return r.valido && el in r.elementos;
                });

                return (
                  <div
                    key={el}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-4 bg-slate-50"
                  >
                    <div className="sm:col-span-2">
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 font-mono font-extrabold text-sm">
                        {el}
                      </span>
                    </div>

                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                        Precursor (base)
                      </label>
                      <select
                        value={opcoesCompativeis.some((o) => o.formula === prec.formula) ? prec.formula : ""}
                        onChange={(e) => selecionarPresetPrecursor(el, e.target.value)}
                        className="w-full px-3 py-2.5 text-xs font-medium"
                      >
                        <option value="">— Manual —</option>
                        {opcoesCompativeis.map((o) => (
                          <option key={o.formula} value={o.formula}>
                            {o.formula} — {o.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Fórmula</label>
                      <input
                        type="text"
                        value={prec.formula}
                        onChange={(e) => atualizarPrecursor(el, "formula", e.target.value)}
                        className="w-full px-3 py-2.5 text-sm font-mono font-bold"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Pureza (%)</label>
                      <input
                        type="number"
                        step="any"
                        min="0.1"
                        max="100"
                        value={prec.purezaPct}
                        onChange={(e) => atualizarPrecursor(el, "purezaPct", e.target.value)}
                        className="w-full px-3 py-2.5 text-sm font-mono font-semibold"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* DOPAGEM OPCIONAL */}
        <section className="bg-white p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900">Dopagem (% mol)</h3>
            <div className="grid grid-cols-3 p-1 rounded-full bg-slate-100 dark:bg-slate-800/80">
              {[
                { id: "nenhuma", label: "Nenhuma" },
                { id: "substitucional", label: "Substitucional" },
                { id: "aditiva", label: "Aditiva" },
              ].map((op) => (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => setDopagem((p) => ({ ...p, modo: op.id }))}
                  className={`px-3 py-1.5 text-xs font-bold rounded-full transition cursor-pointer ${
                    dopagem.modo === op.id
                      ? "bg-white dark:bg-indigo-500 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          {dopagem.modo !== "nenhuma" && (
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-slate-50">
              <div className="sm:col-span-3">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Dopante</label>
                <AutocompleteInput
                  value={dopagem.elementoDopante}
                  onChange={(val) => setDopagem((p) => ({ ...p, elementoDopante: val }))}
                  onSelect={(dados) => selecionarDopante(dados.simbolo)}
                  opcoes={OPCOES_ELEMENTOS}
                  placeholder="Ex: La, Eu, Y..."
                  className="w-full px-3 py-2 text-sm font-mono font-bold"
                />
              </div>

              {dopagem.modo === "substitucional" && (
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Substitui</label>
                  <select
                    value={elementoSubEfetivo}
                    onChange={(e) => setDopagem((p) => ({ ...p, elementoSubstituido: e.target.value }))}
                    className="w-full px-3 py-2 text-sm font-mono font-bold"
                  >
                    {cationsDetectados.map((el) => (
                      <option key={el} value={el}>
                        {el}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">% mol</label>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  max="99"
                  value={dopagem.porcentagemMol}
                  onChange={(e) => setDopagem((p) => ({ ...p, porcentagemMol: e.target.value }))}
                  className="w-full px-2.5 py-2 text-sm font-mono font-bold"
                />
              </div>

              <div className={dopagem.modo === "substitucional" ? "sm:col-span-2" : "sm:col-span-4"}>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Precursor</label>
                <input
                  type="text"
                  value={dopagem.precursorFormula}
                  onChange={(e) => setDopagem((p) => ({ ...p, precursorFormula: e.target.value }))}
                  className="w-full px-2.5 py-2 text-sm font-mono font-bold"
                />
              </div>

              <div className={dopagem.modo === "substitucional" ? "sm:col-span-2" : "sm:col-span-3"}>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">Pur. (%)</label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  max="100"
                  value={dopagem.purezaPct}
                  onChange={(e) => setDopagem((p) => ({ ...p, purezaPct: e.target.value }))}
                  className="w-full px-2.5 py-2 text-sm font-mono"
                />
              </div>
            </div>
          )}

          {dopagem.modo === "substitucional" && (
            <div
              role="note"
              className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-700/40 text-xs leading-relaxed text-amber-900 dark:text-amber-200"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p>
                <strong className="font-semibold">Nota técnica (dopagem substitucional):</strong>{" "}
                o cálculo de massas é feito por balanço catiônico assumindo estequiometria de oxigênio fixa (dopagem isovalente). Em dopagens aliovalentes (como La³⁺ em Ba²⁺), a compensação de carga real pode envolver vacâncias ou mudança de valência.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* COLUNA DIREITA: RESUMO BENTO */}
      <div className="xl:col-span-5 xl:sticky xl:top-5">
        {!resultado.valido ? (
          <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200 text-sm font-medium">
            {resultado.erro}
          </div>
        ) : (
          <aside className="bg-white p-6 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Estequiometria</span>
              <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500">
                {formulaAlvo}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-600/10 via-violet-600/5 to-transparent border border-indigo-500/15">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                Total de precursores a pesar
              </span>
              <div className="text-4xl font-mono font-extrabold tracking-tight text-slate-900 mt-1">
                {resultado.massaTotalPrecursoresG.toFixed(4)}
                <span className="text-lg font-semibold text-slate-400 ml-1.5">g</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-indigo-500/15">
                <div>
                  <span className="block text-[11px] font-medium text-slate-500">Massa molar alvo</span>
                  <span className="text-sm font-mono font-bold text-slate-900">
                    {resultado.massaMolarAlvo.toFixed(3)} g/mol
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] font-medium text-slate-500">Mols do produto</span>
                  <span className="text-sm font-mono font-bold text-slate-900">
                    {resultado.molsAlvo.toFixed(5)} mol
                  </span>
                </div>
              </div>
            </div>

            <BarraProporcao
              titulo="Participação em massa dos precursores (% wt)"
              segmentos={resultado.itens.map((i, idx) => ({
                id: `${i.cation}-${idx}`,
                nome: i.formula,
                pct: (i.massaPesarG / resultado.massaTotalPrecursoresG) * 100,
              }))}
            />

            <div className="space-y-2 pt-1">
              {resultado.itens.map((item, idx) => (
                <div
                  key={`${item.cation}-${idx}`}
                  className="p-3.5 rounded-2xl bg-slate-50 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">
                      <span className="font-mono text-indigo-600 dark:text-indigo-400">{item.formula}</span> · {item.nome}
                      {item.ehDopante && (
                        <span className="ml-1.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
                          Dopante
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-slate-500 mt-0.5">
                      Cátion {item.cation} · Pureza {item.purezaPct}% · {item.molsPrecursor.toFixed(5)} mol
                    </div>
                    {item.alertas?.length > 0 && (
                      <div className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-300 mt-1">
                        <AlertTriangle className="w-3 h-3" /> {item.alertas.join(" · ")}
                      </div>
                    )}
                  </div>
                  <div className="font-mono text-base font-extrabold text-indigo-600 dark:text-indigo-400 shrink-0">
                    {item.massaPesarG.toFixed(4)} g
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleModoBalanca}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-3.5 text-sm font-bold hover:opacity-95 transition shadow-lg shadow-indigo-500/25 cursor-pointer"
            >
              <Scale className="w-4 h-4" /> Abrir Modo Balança
            </button>
          </aside>
        )}
      </div>
    </div>
  );
}
