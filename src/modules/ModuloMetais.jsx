import { useMemo, useState } from "react";
import { Plus, Trash2, Scale, Lock, Unlock } from "lucide-react";
import { calcularLigaMetalica, LIGAS_PRESET } from "../utils/calculoMetais";
import { ELEMENTOS_INFO } from "../data/tabelaPeriodica";
import AutocompleteInput from "../components/AutocompleteInput";
import BarraProporcao from "../components/BarraProporcao";

const OPCOES_ELEMENTOS = ELEMENTOS_INFO.map((el) => ({
  id: el.simbolo,
  chavePrincipal: el.simbolo,
  titulo: `${el.simbolo} — ${el.nome}`,
  subtitulo: `${el.massa} g/mol`,
  busca: `${el.simbolo} ${el.nome} ${el.nomeEn}`,
  dados: el,
}));

export default function ModuloMetais({ onAbrirModoBalanca }) {
  const [modoEntrada, setModoEntrada] = useState("at");
  const [massaAlvoG, setMassaAlvoG] = useState("20");
  const [perdaPct, setPerdaPct] = useState("0");
  const [autoCompletarBase, setAutoCompletarBase] = useState(true);

  const [elementos, setElementos] = useState([
    { id: "el-1", simbolo: "Co", fracaoPct: "20", purezaPct: "99.9", rendimentoPct: "100" },
    { id: "el-2", simbolo: "Cr", fracaoPct: "20", purezaPct: "99.5", rendimentoPct: "100" },
    { id: "el-3", simbolo: "Fe", fracaoPct: "20", purezaPct: "99.9", rendimentoPct: "100" },
    { id: "el-4", simbolo: "Mn", fracaoPct: "20", purezaPct: "99.5", rendimentoPct: "97" },
    { id: "el-5", simbolo: "Ni", fracaoPct: "20", purezaPct: "99.9", rendimentoPct: "100" },
  ]);

  function recalcularBase(lista, travar) {
    if (!travar || lista.length < 2) return lista;
    const somaOutros = lista
      .slice(1)
      .reduce((acc, item) => acc + (parseFloat(item.fracaoPct) || 0), 0);
    const restante = Math.max(0, Number((100 - somaOutros).toFixed(4)));
    return lista.map((item, idx) =>
      idx === 0 ? { ...item, fracaoPct: String(restante) } : item
    );
  }

  function atualizarElemento(id, campo, valor) {
    setElementos((prev) => {
      const atualizada = prev.map((e) => (e.id === id ? { ...e, [campo]: valor } : e));
      if (campo === "fracaoPct" && autoCompletarBase) {
        return recalcularBase(atualizada, true);
      }
      return atualizada;
    });
  }

  function adicionarElemento() {
    setElementos((prev) => {
      const nova = [
        ...prev,
        { id: `el-${Date.now()}`, simbolo: "", fracaoPct: "0", purezaPct: "99.9", rendimentoPct: "100" },
      ];
      return autoCompletarBase ? recalcularBase(nova, true) : nova;
    });
  }

  function removerElemento(id) {
    setElementos((prev) => {
      if (prev.length <= 2) return prev;
      const filtrada = prev.filter((e) => e.id !== id);
      return autoCompletarBase ? recalcularBase(filtrada, true) : filtrada;
    });
  }

  function aplicarPreset(nomePreset) {
    const preset = LIGAS_PRESET.find((p) => p.nome === nomePreset);
    if (!preset) return;
    setModoEntrada(preset.modoEntrada);
    setElementos(preset.elementos.map((e, idx) => ({ id: `el-${Date.now()}-${idx}`, ...e })));
  }

  function alternarTravaBase() {
    setAutoCompletarBase((atual) => {
      const proximo = !atual;
      if (proximo) setElementos((prev) => recalcularBase(prev, true));
      return proximo;
    });
  }

  const resultado = useMemo(
    () =>
      calcularLigaMetalica({
        modoEntrada,
        massaAlvoG: parseFloat(massaAlvoG) || 0,
        perdaPct: parseFloat(perdaPct) || 0,
        elementos,
      }),
    [modoEntrada, massaAlvoG, perdaPct, elementos]
  );

  function handleModoBalanca() {
    if (!resultado.valido) return;
    const formulaResumo = resultado.itens.map((i) => i.simbolo).join("-");
    onAbrirModoBalanca({
      titulo: `Liga Metálica (${formulaResumo})`,
      subtitulo: `Massa nominal: ${resultado.massaNominalG.toFixed(4)} g · Total a pesar: ${resultado.massaTotalPesarG.toFixed(4)} g`,
      itens: resultado.itens.map((item) => ({
        id: item.id,
        nome: `${item.simbolo} (MM ${item.massaAtomica.toFixed(2)} g/mol)`,
        massaG: item.massaPesarG,
        detalhe: `${item.atPct.toFixed(2)}% at. · ${item.wtPct.toFixed(2)}% wt · Pureza ${item.purezaPct}% · Rend. ${item.rendimentoPct}%`,
      })),
    });
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
      {/* COLUNA ESQUERDA */}
      <div className="xl:col-span-7 space-y-5">
        <section className="bg-white p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900">Parâmetros da fusão</h3>
            <button
              type="button"
              onClick={alternarTravaBase}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/10 transition cursor-pointer"
            >
              {autoCompletarBase ? (
                <Lock className="w-3.5 h-3.5 text-indigo-500" />
              ) : (
                <Unlock className="w-3.5 h-3.5 text-slate-400" />
              )}
              {autoCompletarBase ? "Base fecha 100%" : "Frações manuais"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">
                Composição em
              </label>
              <div className="grid grid-cols-2 p-1 rounded-full bg-slate-100 dark:bg-slate-800/80">
                <button
                  type="button"
                  onClick={() => setModoEntrada("at")}
                  className={`py-2 text-xs font-bold rounded-full transition cursor-pointer ${
                    modoEntrada === "at"
                      ? "bg-white dark:bg-indigo-500 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  % at.
                </button>
                <button
                  type="button"
                  onClick={() => setModoEntrada("wt")}
                  className={`py-2 text-xs font-bold rounded-full transition cursor-pointer ${
                    modoEntrada === "wt"
                      ? "bg-white dark:bg-indigo-500 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  % wt.
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">
                Massa do lingote (g)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={massaAlvoG}
                onChange={(e) => setMassaAlvoG(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm font-mono font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">
                Margem global (%)
              </label>
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
            {LIGAS_PRESET.map((p) => (
              <button
                key={p.nome}
                type="button"
                onClick={() => aplicarPreset(p.nome)}
                className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-indigo-500/15 hover:text-indigo-600 dark:hover:text-indigo-300 transition cursor-pointer"
              >
                {p.nome}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Elementos da liga</h3>
            <button
              type="button"
              onClick={adicionarElemento}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </button>
          </div>

          <div className="space-y-3">
            {elementos.map((el, idx) => {
              const baseBloqueada = idx === 0 && autoCompletarBase;
              return (
                <div
                  key={el.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-4 bg-slate-50"
                >
                  <div className="sm:col-span-4">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                      Elemento {idx === 0 ? "(Base)" : ""}
                    </label>
                    <AutocompleteInput
                      value={el.simbolo}
                      onChange={(val) => atualizarElemento(el.id, "simbolo", val)}
                      onSelect={(dados) => atualizarElemento(el.id, "simbolo", dados.simbolo)}
                      opcoes={OPCOES_ELEMENTOS}
                      placeholder="Fe, Ferro, Iron..."
                      className="w-full px-3.5 py-2.5 text-sm font-mono font-bold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                      {modoEntrada === "at" ? "% at." : "% wt."}
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="100"
                      disabled={baseBloqueada}
                      value={el.fracaoPct}
                      onChange={(e) => atualizarElemento(el.id, "fracaoPct", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm font-mono font-bold"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                      Pureza (%)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      max="100"
                      value={el.purezaPct}
                      onChange={(e) => atualizarElemento(el.id, "purezaPct", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm font-mono font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                      Rend. (%)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="1"
                      max="100"
                      value={el.rendimentoPct}
                      onChange={(e) => atualizarElemento(el.id, "rendimentoPct", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm font-mono font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end pt-2 sm:pt-5">
                    {elementos.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removerElemento(el.id)}
                        title="Remover elemento"
                        className="p-2 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
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
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Carga de fusão
              </span>
              <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500">
                IUPAC
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-600/10 via-violet-600/5 to-transparent border border-indigo-500/15">
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                Carga total a pesar
              </span>
              <div className="text-4xl font-mono font-extrabold tracking-tight text-slate-900 mt-1">
                {resultado.massaTotalPesarG.toFixed(4)}
                <span className="text-lg font-semibold text-slate-400 ml-1.5">g</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-indigo-500/15">
                <div>
                  <span className="block text-[11px] font-medium text-slate-500">Massa atômica média</span>
                  <span className="text-sm font-mono font-bold text-slate-900">
                    {resultado.massaAtomicaMedia.toFixed(3)} g/mol
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] font-medium text-slate-500">Mols totais</span>
                  <span className="text-sm font-mono font-bold text-slate-900">
                    {resultado.molsTotais.toFixed(5)} mol
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <BarraProporcao
                titulo="Composição atômica (% at.)"
                segmentos={resultado.itens.map((i) => ({ id: i.id, nome: i.simbolo, pct: i.atPct }))}
              />
              <BarraProporcao
                titulo="Composição mássica (% wt.)"
                segmentos={resultado.itens.map((i) => ({ id: i.id, nome: i.simbolo, pct: i.wtPct }))}
              />
            </div>

            <div className="space-y-2 pt-2">
              {resultado.itens.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-slate-50 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 font-mono">
                      {item.simbolo}{" "}
                      <span className="text-xs font-normal text-slate-500">
                        ({item.massaAtomica.toFixed(2)} g/mol)
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-500 mt-0.5">
                      {item.atPct.toFixed(2)}% at. · {item.wtPct.toFixed(2)}% wt. · Rend. {item.rendimentoPct}%
                    </div>
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
