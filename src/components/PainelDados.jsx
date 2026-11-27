import { useRef, useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Download,
  Upload,
  History,
  FlaskConical,
  ExternalLink,
  Search,
  Globe,
  Loader2,
} from "lucide-react";
import {
  carregarReagentesCustom,
  salvarReagenteCustom,
  removerReagenteCustom,
  carregarHistorico,
  limparHistorico,
  exportarBackupJson,
  importarBackupJson,
} from "../utils/storage";
import { buscarNoPubChem } from "../utils/pubchemApi";

export default function PainelDados({ onFechar, onAbrirHistorico }) {
  const [aba, setAba] = useState("reagentes");
  const [reagentes, setReagentes] = useState(() => carregarReagentesCustom());
  const [historico, setHistorico] = useState(() => carregarHistorico());
  const [msg, setMsg] = useState("");
  const [erroBusca, setErroBusca] = useState("");
  const fileRef = useRef(null);

  // Busca ao vivo no PubChem
  const [termoPubChem, setTermoPubChem] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [resultadoPubChem, setResultadoPubChem] = useState(null);

  const [novo, setNovo] = useState({
    nome: "",
    formula: "",
    densidade_g_cm3: "",
    pureza_padrao_pct: "99.0",
    massa_molar_g_mol: "",
    fonte: "",
    urlReferencia: "",
    observacao: "",
  });

  async function handleBuscarPubChem(e) {
    e.preventDefault();
    if (!termoPubChem.trim()) return;
    setBuscando(true);
    setErroBusca("");
    setResultadoPubChem(null);

    try {
      const res = await buscarNoPubChem(termoPubChem);
      setResultadoPubChem(res);
      setNovo((p) => ({
        ...p,
        nome: res.nome,
        formula: res.formula || "",
        massa_molar_g_mol: res.massa_molar_g_mol ? String(res.massa_molar_g_mol) : "",
        fonte: res.fonte,
        urlReferencia: res.urlReferencia,
        observacao: res.nomeIupac ? `IUPAC: ${res.nomeIupac}` : p.observacao,
      }));
    } catch (err) {
      setErroBusca(err.message || "Falha ao consultar o PubChem.");
    } finally {
      setBuscando(false);
    }
  }

  function handleSalvarReagente(e) {
    e.preventDefault();
    if (!novo.nome.trim()) return;
    const atualizada = salvarReagenteCustom({
      nome: novo.nome.trim(),
      formula: novo.formula.trim() || null,
      densidade_g_cm3: parseFloat(novo.densidade_g_cm3) || null,
      pureza_padrao_pct: parseFloat(novo.pureza_padrao_pct) || 100,
      massa_molar_g_mol: parseFloat(novo.massa_molar_g_mol) || null,
      fonte: novo.fonte.trim() || "Cadastro manual (rótulo / ficha técnica)",
      urlReferencia: novo.urlReferencia.trim() || null,
      observacao: novo.observacao.trim(),
    });
    setReagentes(atualizada);
    setResultadoPubChem(null);
    setTermoPubChem("");
    setNovo({
      nome: "",
      formula: "",
      densidade_g_cm3: "",
      pureza_padrao_pct: "99.0",
      massa_molar_g_mol: "",
      fonte: "",
      urlReferencia: "",
      observacao: "",
    });
    setMsg("Reagente salvo localmente com referência. Já disponível offline.");
  }

  function handleImportar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const res = importarBackupJson(String(reader.result));
        setReagentes(res.reagentesCustom);
        setHistorico(res.historico);
        setMsg("Backup .json restaurado com sucesso.");
      } catch {
        setMsg("Erro ao ler o arquivo .json.");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#141720] border border-slate-200 dark:border-white/10 rounded-3xl max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10">
          <h2 className="text-lg font-bold">Dados Científicos, Reagentes & Backup</h2>
          <button
            type="button"
            onClick={onFechar}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de abas + backup */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02]">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAba("reagentes")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
                aba === "reagentes"
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10"
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" /> Meus Reagentes ({reagentes.length})
            </button>
            <button
              type="button"
              onClick={() => setAba("historico")}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
                aba === "historico"
                  ? "bg-indigo-600 text-white"
                  : "bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10"
              }`}
            >
              <History className="w-3.5 h-3.5" /> Histórico ({historico.length})
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={exportarBackupJson}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Backup .json
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" /> Importar .json
            </button>
            <input ref={fileRef} type="file" accept=".json" onChange={handleImportar} className="hidden" />
          </div>
        </div>

        {msg && (
          <div className="px-6 py-2.5 text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-b border-emerald-500/20">
            {msg}
          </div>
        )}

        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {aba === "historico" ? (
            <>
              {historico.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Nenhuma formulação salva ainda. Clique em "Abrir Modo Balança" em qualquer módulo para registrar automaticamente.
                </p>
              ) : (
                <>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setHistorico(limparHistorico())}
                      className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      Limpar todo o histórico
                    </button>
                  </div>
                  <div className="space-y-2.5">
                    {historico.map((h) => (
                      <div
                        key={h.id}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="font-bold text-sm">{h.titulo}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{h.subtitulo}</div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(h.data).toLocaleString("pt-BR")} · {h.itens?.length || 0} itens
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onAbrirHistorico(h);
                            onFechar();
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-indigo-600 text-white text-xs font-semibold shrink-0 cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Abrir
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              {/* BUSCA AO VIVO NO PUBCHEM (NIH) */}
              <form
                onSubmit={handleBuscarPubChem}
                className="p-4 rounded-2xl bg-indigo-500/8 border border-indigo-500/20 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                    <Globe className="w-4 h-4" /> Buscar dados oficiais no PubChem (NIH)
                  </span>
                  <span className="text-[11px] text-slate-500">Salva offline após importar</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex: Ácido cítrico, Hidróxido de sódio, Cobre, BaCO3..."
                    value={termoPubChem}
                    onChange={(e) => setTermoPubChem(e.target.value)}
                    className="w-full rounded-xl bg-white dark:bg-[#0b0d12] border border-slate-200 dark:border-white/10 px-3.5 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={buscando}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 disabled:opacity-60 shrink-0 cursor-pointer"
                  >
                    {buscando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    Buscar
                  </button>
                </div>

                {erroBusca && <p className="text-xs text-rose-600 dark:text-rose-400">{erroBusca}</p>}

                {resultadoPubChem && (
                  <div className="p-3 rounded-xl bg-white dark:bg-[#0b0d12] border border-indigo-500/25 text-xs space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm">
                        {resultadoPubChem.nome}{" "}
                        <span className="font-mono text-indigo-600 dark:text-indigo-400">
                          ({resultadoPubChem.formula})
                        </span>
                      </span>
                      <a
                        href={resultadoPubChem.urlReferencia}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-mono"
                      >
                        CID {resultadoPubChem.cid} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400">
                      MM: <strong className="font-mono">{resultadoPubChem.massa_molar_g_mol} g/mol</strong>
                      {resultadoPubChem.nomeIupac ? ` · IUPAC: ${resultadoPubChem.nomeIupac}` : ""}
                    </div>
                    <div className="text-[11px] text-indigo-600 dark:text-indigo-300">
                      {resultadoPubChem.traduzido
                        ? `Buscado no PubChem como "${resultadoPubChem.termoBuscado}" (de "${resultadoPubChem.termoOriginal}").`
                        : `Termo consultado no PubChem: "${resultadoPubChem.termoBuscado}".`}
                    </div>
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      Campos preenchidos abaixo. Se tiver a densidade/pureza do rótulo, complete e clique em Salvar.
                    </div>
                  </div>
                )}
              </form>

              {/* FORMULARIO DE SALVAMENTO LOCAL */}
              <form
                onSubmit={handleSalvarReagente}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10"
              >
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    required
                    placeholder="Nome do reagente *"
                    value={novo.nome}
                    onChange={(e) => setNovo((p) => ({ ...p, nome: e.target.value }))}
                    className="w-full rounded-xl bg-white dark:bg-[#0b0d12] border border-slate-200 dark:border-white/10 px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    placeholder="Fórmula (ex: ZnO)"
                    value={novo.formula}
                    onChange={(e) => setNovo((p) => ({ ...p, formula: e.target.value }))}
                    className="w-full rounded-xl bg-white dark:bg-[#0b0d12] border border-slate-200 dark:border-white/10 px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    placeholder="ρ (g/cm³)"
                    value={novo.densidade_g_cm3}
                    onChange={(e) => setNovo((p) => ({ ...p, densidade_g_cm3: e.target.value }))}
                    className="w-full rounded-xl bg-white dark:bg-[#0b0d12] border border-slate-200 dark:border-white/10 px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    placeholder="Pureza %"
                    value={novo.pureza_padrao_pct}
                    onChange={(e) => setNovo((p) => ({ ...p, pureza_padrao_pct: e.target.value }))}
                    className="w-full rounded-xl bg-white dark:bg-[#0b0d12] border border-slate-200 dark:border-white/10 px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    placeholder="Fonte / Referência (ex: PubChem CID, Ficha técnica)"
                    value={novo.fonte}
                    onChange={(e) => setNovo((p) => ({ ...p, fonte: e.target.value }))}
                    className="w-full rounded-xl bg-white dark:bg-[#0b0d12] border border-slate-200 dark:border-white/10 px-3 py-2 text-xs"
                  />
                </div>
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    placeholder="Observação / lote (opcional)"
                    value={novo.observacao}
                    onChange={(e) => setNovo((p) => ({ ...p, observacao: e.target.value }))}
                    className="w-full rounded-xl bg-white dark:bg-[#0b0d12] border border-slate-200 dark:border-white/10 px-3 py-2 text-xs"
                  />
                </div>
                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 text-white px-3 py-2 text-xs font-bold hover:bg-indigo-500 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Salvar
                  </button>
                </div>
              </form>

              {reagentes.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Nenhum reagente salvo neste aparelho ainda. Busque no PubChem acima ou cadastre manualmente.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {reagentes.map((r) => (
                    <div
                      key={r.id}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-sm truncate">
                          {r.nome}{" "}
                          {r.formula && <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400">({r.formula})</span>}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {r.massa_molar_g_mol ? `MM ${r.massa_molar_g_mol} g/mol · ` : ""}
                          {r.densidade_g_cm3 ? `ρ = ${r.densidade_g_cm3} g/cm³ · ` : ""}
                          Pureza {r.pureza_padrao_pct}%
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>Fonte: {r.fonte || "Manual"}</span>
                          {r.urlReferencia && (
                            <a
                              href={r.urlReferencia}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-0.5 text-indigo-500 hover:underline"
                            >
                              link <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReagentes(removerReagenteCustom(r.id))}
                        className="p-2 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
