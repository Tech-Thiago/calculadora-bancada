/**
 * Converte uma fórmula química em tokens de texto normal e subscrito.
 * Números imediatamente após letra, ')' ou ']' viram subscrito (ex: H2O, Ba0.85).
 * Coeficientes multiplicadores no início ou após '·', '•', '*', espaço ou '+' ficam normais (ex: 4 em ·4H2O).
 */
export function tokenizarFormulaQuimica(formula) {
  const texto = String(formula ?? "");
  if (!texto) return [];

  const tokens = [];
  const regex = /(\d+(?:[.,]\d+)?)/g;
  let ultimoIndice = 0;
  let match;

  while ((match = regex.exec(texto)) !== null) {
    if (match.index > ultimoIndice) {
      tokens.push({ tipo: "texto", valor: texto.slice(ultimoIndice, match.index) });
    }

    const anterior = match.index > 0 ? texto[match.index - 1] : "";
    const ehSubscrito = /[A-Za-z)\]]/.test(anterior);
    tokens.push({
      tipo: ehSubscrito ? "sub" : "texto",
      valor: match[0],
    });

    ultimoIndice = regex.lastIndex;
  }

  if (ultimoIndice < texto.length) {
    tokens.push({ tipo: "texto", valor: texto.slice(ultimoIndice) });
  }

  return tokens;
}

export default function FormulaQuimica({ formula, className = "" }) {
  const tokens = tokenizarFormulaQuimica(formula);
  if (!tokens.length) return null;

  return (
    <span className={className}>
      {tokens.map((token, idx) =>
        token.tipo === "sub" ? (
          <sub key={idx} className="text-[0.72em] leading-none align-baseline relative top-[0.22em]">
            {token.valor}
          </sub>
        ) : (
          <span key={idx}>{token.valor}</span>
        )
      )}
    </span>
  );
}
