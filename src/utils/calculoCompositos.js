/**
 * Calcula a formulação de compósitos ou blendas para N componentes.
 * @param {Object} params
 * @param {"wt" | "vol"} params.modoEntrada - Se o usuário informou % wt ou % vol
 * @param {"massa" | "volume"} params.alvoTipo - Se o alvo final é massa total (g) ou volume (cm³)
 * @param {number} params.alvoValor - Valor numérico alvo (g ou cm³)
 * @param {number} params.perdaPct - Margem de perda em % (ex: 5 para +5%)
 * @param {Array<{id: string, nome: string, densidade: number, fracaoPct: number}>} params.componentes
 */
export function calcularComposito({
  modoEntrada = "wt",
  alvoTipo = "massa",
  alvoValor = 50,
  perdaPct = 0,
  componentes = [],
}) {
  const validos = componentes.filter(
    (c) => Number(c.densidade) > 0 && !Number.isNaN(Number(c.fracaoPct))
  );

  if (validos.length === 0 || Number(alvoValor) <= 0) {
    return { valido: false, erro: "Informe ao menos um componente com densidade maior que zero e um alvo positivo." };
  }

  const somaFracoesPct = validos.reduce((acc, c) => acc + Number(c.fracaoPct), 0);
  if (Math.abs(somaFracoesPct - 100) > 0.05) {
    return {
      valido: false,
      erro: `A soma das frações está em ${somaFracoesPct.toFixed(2)}%. Ajuste para fechar em 100%.`,
    };
  }

  const fPerda = 1 + Math.max(0, Number(perdaPct)) / 100;
  let rhoComp = 0;
  let itensBase = [];

  if (modoEntrada === "wt") {
    // w_i = %wt / 100; rho_c = 1 / sum(w_i / rho_i)
    const comRazao = validos.map((c) => {
      const w = Number(c.fracaoPct) / 100;
      const rho = Number(c.densidade);
      return { ...c, w, rho, volRel: w / rho };
    });

    const somaVolRel = comRazao.reduce((acc, item) => acc + item.volRel, 0);
    rhoComp = 1 / somaVolRel;

    itensBase = comRazao.map((item) => {
      const v = item.volRel / somaVolRel;
      return {
        ...item,
        v,
        wtPct: item.w * 100,
        volPct: v * 100,
      };
    });
  } else {
    // v_i = %vol / 100; rho_c = sum(v_i * rho_i)
    const comMassaRel = validos.map((c) => {
      const v = Number(c.fracaoPct) / 100;
      const rho = Number(c.densidade);
      return { ...c, v, rho, massaRel: v * rho };
    });

    rhoComp = comMassaRel.reduce((acc, item) => acc + item.massaRel, 0);

    itensBase = comMassaRel.map((item) => {
      const w = item.massaRel / rhoComp;
      return {
        ...item,
        w,
        wtPct: w * 100,
        volPct: item.v * 100,
      };
    });
  }

  let massaPrepG = 0;
  let volumePrepCm3 = 0;

  if (alvoTipo === "massa") {
    massaPrepG = Number(alvoValor) * fPerda;
    volumePrepCm3 = massaPrepG / rhoComp;
  } else {
    volumePrepCm3 = Number(alvoValor) * fPerda;
    massaPrepG = volumePrepCm3 * rhoComp;
  }

  const itens = itensBase.map((item) => {
    const massaG = massaPrepG * item.w;
    const volumeCm3 = massaG / item.rho;
    return {
      id: item.id,
      nome: item.nome || "Componente",
      densidade: item.rho,
      wtPct: item.wtPct,
      volPct: item.volPct,
      massaG,
      volumeCm3,
    };
  });

  return {
    valido: true,
    densidadeTeorica: rhoComp,
    massaTotalG: massaPrepG,
    volumeTotalCm3: volumePrepCm3,
    itens,
  };
}
