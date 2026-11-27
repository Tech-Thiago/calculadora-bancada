import { useMemo, useState } from "react";
import { Plus, Trash2, Scale, Lock, Unlock } from "lucide-react";
import reagentesData from "../data/reagentes.json";
import { calcularComposito } from "../utils/calculoCompositos";
import { carregarReagentesCustom } from "../utils/storage";
import AutocompleteInput from "../components/AutocompleteInput";
import BarraProporcao from "../components/BarraProporcao";
import AtalhosEscala from "../components/AtalhosEscala";
import { TEMAS_MODULO } from "../utils/temaModulos";

const tema = TEMAS_MODULO.compositos;

export default function ModuloCompositos({ onAbrirModoBalanca }) {
  const [modoEntrada, setModoEntrada] = useState("vol");
  const [alvoTipo, setAlvoTipo] = useState("volume");
  const [alvoValor, setAlvoValor] = useState("50");
  const [perdaPct, setPerdaPct] = useState("0");
  const [autoCompletarMatriz, setAutoCompletarMatriz] = useState(true);

  const opcoesBusca = useMemo(() => {
    const oficiais = reagentesData.reagentes
      .filter((r) => r.modulos.includes("compositos") && r.densidade_g_cm3)
      .map((r) => ({
        id: r.id,
        chavePrincipal: r.nome,
        titulo: r.nome,
        subtitulo: `${r.densidade_g_cm3} g/cm³`,
        busca: `${r.nome} ${r.formula || ""} ${(r.apelidos || []).join(" ")}`,
        dados: { nome: r.nome, densidade: r.densidade_g_cm3 },
      }));

    const custom = carregarReagentesCustom()
      .filter((r) => r.densidade_g_cm3)
      .map((r) => ({
        id: r.id,
        chavePrincipal: r.nome,
        titulo: `${r.nome} ★`,
        subtitulo: `${r.densidade_g_cm3} g/cm³`,
        busca: `${r.nome} ${r.formula || ""}`,
        dados: { nome: r.nome, densidade: r.densidade_g_cm3 },
      }));

    return [...custom, ...oficiais];
  }, []);

  const [componentes, setComponentes] = useState([
    { id: "comp-1", nome: "Resina Epóxi DGEBA (básica)", densidade: "1.16", fracaoPct: "70" },
    { id: "comp-2", nome: "Fibra de Carbono (módulo padrão)", densidade: "1.78", fracaoPct: "30" },
  ]);

  function recalcularComMatriz(lista, travarMatriz) {
    if (!travarMatriz || lista.length < 2) return lista;
    const somaOutros = lista.slice(1).reduce((acc, item) => acc + (parseFloat(item.fracaoPct) || 0), 0);
    const restante = Math.max(0, Number((100 - somaOutros).toFixed(4)));
    return lista.map((item, idx) => (idx === 0 ? { ...item, fracaoPct: String(restante) } : item));
  }

  function atualizarComponente(id, campo, valor) {
    setComponentes((prev) => {
      const atualizada = prev.map((c) => (c.id === id ? { ...c, [campo]: valor } : c));
      if (campo === "fracaoPct" && autoCompletarMatriz) {
        return recalcularComMatriz(atualizada, true);
      }
      return atualizada;
    });
  }

  function selecionarMaterial(id, dados) {
    setComponentes((prev) =>
      prev.map((c) => (c.id === id ? { ...c, nome: dados.nome, densidade: String(dados.densidade) } : c))
    );
  }

  function adicionarComponente() {
    setComponentes((prev) => {
      const nova = [...prev, { id: `comp-${Date.now()}`, nome: "", densidade: "1.50", fracaoPct: "0" }];
      return autoCompletarMatriz ? recalcularComMatriz(nova, true) : nova;
    });
  }

  function removerComponente(id) {
    setComponentes((prev) => {
      if (prev.length <= 2) return prev;
      const filtrada = prev.filter((c) => c.id !== id);
      return autoCompletarMatriz ? recalcularComMatriz(filtrada, true) : filtrada;
    });
  }

  function alternarTravaMatriz() {
    setAutoCompletarMatriz((atual) => {
      const proximo = !atual;
      if (proximo) setComponentes((prev) => recalcularComMatriz(prev, true));
      return proximo;
    });
  }

  const resultado = useMemo(
    () =>
      calcularComposito({
        modoEntrada,
        alvoTipo,
        alvoValor: parseFloat(alvoValor) || 0,
        perdaPct: parseFloat(perdaPct) || 0,
        componentes: componentes.map((c) => ({
          id: c.id,
          nome: c.nome,
          densidade: parseFloat(c.densidade) || 0,
          fracaoPct: parseFloat(c.fracaoPct) || 0,
        })),
      }),
    [modoEntrada, alvoTipo, alvoValor, perdaPct, componentes]
  );

  function handleModoBalanca() {
    if (!resultado.valido) return;
    onAbrirModoBalanca({
      titulo: "Compósitos e Blendas",
      subtitulo: `Densidade teórica: ${resultado.densidadeTeorica.toFixed(4)} g/cm³ · Total: ${resultado.massaTotalG.toFixed(4)} g`,
      itens: resultado.itens.map((item) => ({
        id: item.id,
        nome: item.nome,
        massaG: item.massaG,
        detalhe: `${item.wtPct.toFixed(2)}% wt · ${item.volPct.toFixed(2)}% vol (${item.volumeCm3.toFixed(2)} cm³)`,
      })),
    });
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
      {/* COLUNA ESQUERDA */}
      <div className="xl:col-span-7 space-y-5">
        <section className="bg-white p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900">Parâmetros da batelada</h3>
            <button
              type="button"
              onClick={alternarTravaMatriz}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-white/10 transition cursor-pointer"
            >
              {autoCompletarMatriz ? (
                <Lock className={`w-3.5 h-3.5 ${tema.travaIcon}`} />
              ) : (
                <Unlock className="w-3.5 h-3.5 text-slate-400" />
              )}
              {autoCompletarMatriz ? "Matriz fecha 100%" : "Frações manuais"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">
                Fração informada em
              </label>
              <div className="grid grid-cols-2 p-1 rounded-full bg-slate-100 dark:bg-slate-800/80">
                <button
                  type="button"
                  onClick={() => setModoEntrada("vol")}
                  className={`py-2 text-xs font-bold rounded-full transition cursor-pointer ${
                    modoEntrada === "vol"
                      ? tema.pillAtiva
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  % vol
                </button>
                <button
                  type="button"
                  onClick={() => setModoEntrada("wt")}
                  className={`py-2 text-xs font-bold rounded-full transition cursor-pointer ${
                    modoEntrada === "wt"
                      ? tema.pillAtiva
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  % wt
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">
                Meta final
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={alvoValor}
                  onChange={(e) => setAlvoValor(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm font-mono font-semibold"
                />
                <select
                  value={alvoTipo}
                  onChange={(e) => setAlvoTipo(e.target.value)}
                  className="px-3 py-2.5 text-xs font-bold"
                >
                  <option value="volume">cm³</option>
                  <option value="massa">g</option>
                </select>
              </div>
              <AtalhosEscala
                valorAtual={alvoValor}
                onChange={setAlvoValor}
                unidade={alvoTipo === "volume" ? "cm³" : "g"}
                presets={[10, 50, 100]}
                chipHover={tema.chipHover}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">
                Margem de perda (%)
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
        </section>

        <section className="bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Componentes da mistura</h3>
            <button
              type="button"
              onClick={adicionarComponente}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition cursor-pointer ${tema.botaoSecundario}`}
            >
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </button>
          </div>

          <div className="space-y-3">
            {componentes.map((comp, idx) => {
              const matrizBloqueada = idx === 0 && autoCompletarMatriz;
              return (
                <div
                  key={comp.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-4 bg-slate-50"
                >
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                      {idx === 0 ? "Matriz" : `Reforço / Carga ${idx}`}
                    </label>
                    <AutocompleteInput
                      value={comp.nome}
                      onChange={(val) => atualizarComponente(comp.id, "nome", val)}
                      onSelect={(dados) => selecionarMaterial(comp.id, dados)}
                      opcoes={opcoesBusca}
                      placeholder="Buscar: epoxi, fibra, alumina..."
                      className="w-full px-3.5 py-2.5 text-sm font-medium"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                      Densidade (g/cm³)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.001"
                      value={comp.densidade}
                      onChange={(e) => atualizarComponente(comp.id, "densidade", e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm font-mono font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                      {modoEntrada === "vol" ? "% vol" : "% wt"}
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="100"
                      disabled={matrizBloqueada}
                      value={comp.fracaoPct}
                      onChange={(e) => atualizarComponente(comp.id, "fracaoPct", e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm font-mono font-bold"
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-end pt-2 sm:pt-5">
                    {componentes.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removerComponente(comp.id)}
                        title="Remover componente"
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
                Resultado
              </span>
              <span className={`text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full border ${tema.headerBadge}`}>
                ASTM D2734
              </span>
            </div>

            <div className={`p-5 rounded-2xl ${tema.visorContainer}`}>
              <span className={`text-[11px] font-mono font-bold uppercase tracking-wider ${tema.visorLabel}`}>
                Massa total a preparar
              </span>
              <div className="text-4xl font-mono font-extrabold tracking-tight text-slate-900 mt-1.5 tabular-nums">
                {resultado.massaTotalG.toFixed(4)}
                <span className="text-lg font-semibold text-slate-400 ml-1.5">g</span>
              </div>

              <div className={`grid grid-cols-2 gap-3 mt-4 pt-4 border-t ${tema.visorDivisor}`}>
                <div>
                  <span className="block text-[11px] font-medium text-slate-500">Densidade teórica</span>
                  <span className="text-sm font-mono font-bold text-slate-900 tabular-nums">
                    {resultado.densidadeTeorica.toFixed(4)} g/cm³
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] font-medium text-slate-500">Volume total</span>
                  <span className="text-sm font-mono font-bold text-slate-900 tabular-nums">
                    {resultado.volumeTotalCm3.toFixed(2)} cm³
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <BarraProporcao
                titulo="Distribuição em volume (% vol)"
                segmentos={resultado.itens.map((i) => ({ id: i.id, nome: i.nome, pct: i.volPct }))}
              />
              <BarraProporcao
                titulo="Distribuição em massa (% wt)"
                segmentos={resultado.itens.map((i) => ({ id: i.id, nome: i.nome, pct: i.wtPct }))}
              />
            </div>

            <div className="space-y-2 pt-2">
              {resultado.itens.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-slate-50 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 truncate">{item.nome}</div>
                    <div className="text-xs font-mono text-slate-500 mt-0.5">
                      {item.wtPct.toFixed(2)}% wt · {item.volPct.toFixed(2)}% vol · {item.volumeCm3.toFixed(2)} cm³
                    </div>
                  </div>
                  <div className={`font-mono text-base font-extrabold shrink-0 tabular-nums ${tema.valorItem}`}>
                    {item.massaG.toFixed(4)} g
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleModoBalanca}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-bold transition cursor-pointer ${tema.botaoPrimario}`}
            >
              <Scale className="w-4 h-4" /> Abrir Modo Balança
            </button>
          </aside>
        )}
      </div>
    </div>
  );
}
