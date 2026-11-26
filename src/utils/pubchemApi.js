/**
 * Consulta a API aberta PUG REST do PubChem (NIH / NCBI).
 * Retorna apenas dados oficiais com CID e URL direta para referenciamento.
 */
export async function buscarNoPubChem(termo) {
  const query = String(termo || "").trim();
  if (!query) {
    throw new Error("Digite um nome em inglês ou fórmula química para buscar.");
  }

  const encoded = encodeURIComponent(query);
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encoded}/property/Title,IUPACName,MolecularFormula,MolecularWeight/JSON`;

  const resp = await fetch(url);
  if (!resp.ok) {
    if (resp.status === 404) {
      throw new Error(`"${query}" não encontrado no PubChem. Tente o nome em inglês (ex: "Sodium hydroxide") ou a fórmula.`);
    }
    throw new Error(`Erro ao consultar o PubChem (HTTP ${resp.status}).`);
  }

  const data = await resp.json();
  const props = data?.PropertyTable?.Properties?.[0];
  if (!props) {
    throw new Error("Nenhum dado retornado pelo PubChem.");
  }

  return {
    cid: props.CID,
    nome: props.Title || query,
    nomeIupac: props.IUPACName || null,
    formula: props.MolecularFormula || null,
    massa_molar_g_mol: props.MolecularWeight ? Number(props.MolecularWeight) : null,
    fonte: `PubChem (NIH) · CID ${props.CID}`,
    urlReferencia: `https://pubchem.ncbi.nlm.nih.gov/compound/${props.CID}`,
    extraidoEm: new Date().toISOString(),
  };
}
