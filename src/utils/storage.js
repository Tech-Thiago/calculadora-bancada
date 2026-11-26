const KEY_REAGENTES = "calc_bancada_reagentes_custom_v1";
const KEY_HISTORICO = "calc_bancada_historico_v1";

export function carregarReagentesCustom() {
  try {
    const raw = localStorage.getItem(KEY_REAGENTES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function salvarReagenteCustom(reagente) {
  const atual = carregarReagentesCustom();
  const novo = {
    id: `custom_${Date.now()}`,
    criadoEm: new Date().toISOString(),
    ...reagente,
  };
  const lista = [novo, ...atual];
  localStorage.setItem(KEY_REAGENTES, JSON.stringify(lista));
  return lista;
}

export function removerReagenteCustom(id) {
  const lista = carregarReagentesCustom().filter((r) => r.id !== id);
  localStorage.setItem(KEY_REAGENTES, JSON.stringify(lista));
  return lista;
}

export function carregarHistorico() {
  try {
    const raw = localStorage.getItem(KEY_HISTORICO);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function adicionarHistorico(payload) {
  const atual = carregarHistorico();
  const entrada = {
    id: `hist_${Date.now()}`,
    data: new Date().toISOString(),
    ...payload,
  };
  const lista = [entrada, ...atual].slice(0, 30);
  localStorage.setItem(KEY_HISTORICO, JSON.stringify(lista));
  return lista;
}

export function limparHistorico() {
  localStorage.removeItem(KEY_HISTORICO);
  return [];
}

export function exportarBackupJson() {
  const dados = {
    schemaVersion: 1,
    exportadoEm: new Date().toISOString(),
    reagentesCustom: carregarReagentesCustom(),
    historico: carregarHistorico(),
  };
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `backup-calculadora-bancada-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importarBackupJson(textoJson) {
  const dados = JSON.parse(textoJson);
  if (!dados || typeof dados !== "object") {
    throw new Error("Arquivo JSON inválido.");
  }
  if (Array.isArray(dados.reagentesCustom)) {
    localStorage.setItem(KEY_REAGENTES, JSON.stringify(dados.reagentesCustom));
  }
  if (Array.isArray(dados.historico)) {
    localStorage.setItem(KEY_HISTORICO, JSON.stringify(dados.historico));
  }
  return {
    reagentesCustom: carregarReagentesCustom(),
    historico: carregarHistorico(),
  };
}
