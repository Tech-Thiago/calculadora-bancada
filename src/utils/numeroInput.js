/**
 * Sanitiza entrada numérica em pt-BR permitindo dígitos, ponto ou vírgula decimal.
 * Preserva entradas parciais como "0," ou "1," durante a digitação.
 */
export function sanitizarNumeroDecimal(
  valor,
  { apenasInteiro = false, permitirNegativo = false } = {}
) {
  const texto = String(valor ?? "");
  if (!texto) return "";

  if (apenasInteiro) {
    if (permitirNegativo) {
      const negativo = texto.trimStart().startsWith("-") ? "-" : "";
      const digitos = texto.replace(/\D/g, "");
      return negativo + digitos;
    }
    return texto.replace(/\D/g, "");
  }

  let resultado = "";
  let temSeparador = false;
  let temSinal = false;

  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (ch >= "0" && ch <= "9") {
      resultado += ch;
    } else if ((ch === "," || ch === ".") && !temSeparador) {
      resultado += ch;
      temSeparador = true;
    } else if (permitirNegativo && ch === "-" && !temSinal && resultado === "") {
      resultado += "-";
      temSinal = true;
    }
  }

  return resultado;
}

/**
 * Converte string numérica com vírgula ou ponto em número JS.
 * Entradas parciais como "0," ou "1," retornam 0 e 1; vazios/inválidos retornam fallback.
 */
export function parseNumeroBr(valor, fallback = NaN) {
  if (typeof valor === "number") {
    return Number.isFinite(valor) ? valor : fallback;
  }
  const limpo = String(valor ?? "").trim().replace(",", ".");
  if (!limpo || limpo === "-" || limpo === "." || limpo === "-.") {
    return fallback;
  }
  const num = Number(limpo);
  return Number.isFinite(num) ? num : fallback;
}
