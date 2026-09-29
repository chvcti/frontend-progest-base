/**
 * Utilitário de Cálculos Financeiros e Rateio para Entradas de Estoque
 * Funções matemáticas puras para cálculos de notas fiscais, itens e custos efetivos.
 */

/**
 * Calcula o subtotal financeiro de um item baseado em quantidade e valor unitário.
 *
 * @param {number|string} quantidade
 * @param {number|string} valorUnitario
 * @returns {number} Subtotal arredondado para 2 casas decimais
 */
export function calcularSubtotalItem(quantidade, valorUnitario) {
  const qtd = parseFloat(quantidade) || 0;
  const unit = parseFloat(valorUnitario) || 0;
  if (qtd <= 0 || unit <= 0) return 0;
  return Number((qtd * unit).toFixed(2));
}

/**
 * Calcula o valor unitário de um item com base no valor informado e modalidade (unitário ou total).
 *
 * @param {number|string} valor - Valor digitado
 * @param {number|string} quantidade - Quantidade do item
 * @param {'unitario'|'total'} [tipoValor='unitario'] - Tipo de valor fornecido
 * @returns {number|null} Valor unitário calculado (até 4 casas decimais) ou null se inválido
 */
export function calcularValorUnitario(valor, quantidade, tipoValor = 'unitario') {
  if (valor === '' || valor === null || valor === undefined) return null;
  const numValor = parseFloat(valor);
  if (isNaN(numValor) || numValor < 0) return null;

  const numQtd = parseFloat(quantidade) || 0;

  if (tipoValor === 'total') {
    if (numQtd <= 0) return null;
    return Number((numValor / numQtd).toFixed(4));
  }

  return Number(numValor.toFixed(4));
}

/**
 * Calcula a soma total dos valores de todos os itens da entrada.
 *
 * @param {Array<Object>} [itens=[]] - Lista de itens ({ quantidade, valor_unitario })
 * @returns {number} Valor total acumulado dos itens
 */
export function calcularTotalItens(itens = []) {
  if (!Array.isArray(itens) || itens.length === 0) return 0;
  const total = itens.reduce((acc, item) => {
    const qtd = parseFloat(item.quantidade) || 0;
    const unit = parseFloat(item.valor_unitario) || 0;
    return acc + (qtd * unit);
  }, 0);
  return Number(total.toFixed(2));
}

/**
 * Calcula a soma total das quantidades de todos os itens da entrada.
 *
 * @param {Array<Object>} [itens=[]] - Lista de itens ({ quantidade })
 * @returns {number} Quantidade total de unidades
 */
export function calcularTotalQuantidade(itens = []) {
  if (!Array.isArray(itens) || itens.length === 0) return 0;
  return itens.reduce((acc, item) => acc + (parseFloat(item.quantidade) || 0), 0);
}

/**
 * Calcula o valor total final da nota fiscal considerando itens, frete, despesas adicionais e descontos.
 *
 * @param {Object} options
 * @param {Array<Object>} [options.itens=[]] - Itens da nota fiscal
 * @param {number|string} [options.frete=0] - Valor do frete
 * @param {number|string} [options.desconto=0] - Valor do desconto
 * @param {number|string} [options.outrasDespesas=0] - Outras despesas acessórias
 * @returns {number} Total líquido da nota fiscal
 */
export function calcularTotalNota({ itens = [], frete = 0, desconto = 0, outrasDespesas = 0 } = {}) {
  const totalItens = calcularTotalItens(itens);
  const numFrete = Math.max(0, parseFloat(frete) || 0);
  const numDesconto = Math.max(0, parseFloat(desconto) || 0);
  const numOutras = Math.max(0, parseFloat(outrasDespesas) || 0);

  const total = totalItens + numFrete + numOutras - numDesconto;
  return Number(Math.max(0, total).toFixed(2));
}

/**
 * Realiza o rateio proporcional de frete, despesas acessórias e desconto entre os itens da nota.
 * Retorna os itens enriquecidos com suas respectivas parcelas de rateio e custo unitário efetivo.
 *
 * @param {Object} options
 * @param {Array<Object>} options.itens - Lista de itens
 * @param {number|string} [options.frete=0] - Valor de frete a ratear
 * @param {number|string} [options.desconto=0] - Valor de desconto a ratear
 * @param {number|string} [options.outrasDespesas=0] - Outras despesas a ratear
 * @returns {Array<Object>} Lista de itens enriquecida com campos de rateio
 */
export function calcularRateioFreteDesconto({ itens = [], frete = 0, desconto = 0, outrasDespesas = 0 } = {}) {
  if (!Array.isArray(itens) || itens.length === 0) return [];

  const totalBaseItens = calcularTotalItens(itens);
  const totalBaseQtd = calcularTotalQuantidade(itens);

  const numFrete = Math.max(0, parseFloat(frete) || 0);
  const numDesconto = Math.max(0, parseFloat(desconto) || 0);
  const numOutras = Math.max(0, parseFloat(outrasDespesas) || 0);

  return itens.map((item) => {
    const qtd = parseFloat(item.quantidade) || 0;
    const unit = parseFloat(item.valor_unitario) || 0;
    const subtotal = Number((qtd * unit).toFixed(2));

    // Proporção baseada no valor total do item, ou na quantidade se todos os itens tiverem valor 0
    let proporcao = 0;
    if (totalBaseItens > 0) {
      proporcao = subtotal / totalBaseItens;
    } else if (totalBaseQtd > 0) {
      proporcao = qtd / totalBaseQtd;
    }

    const rateioFrete = Number((numFrete * proporcao).toFixed(2));
    const rateioDesconto = Number((numDesconto * proporcao).toFixed(2));
    const rateioOutrasDespesas = Number((numOutras * proporcao).toFixed(2));

    const custoTotalItem = Number(
      Math.max(0, subtotal + rateioFrete + rateioOutrasDespesas - rateioDesconto).toFixed(2)
    );

    const custoEfetivoUnitario = qtd > 0
      ? Number((custoTotalItem / qtd).toFixed(4))
      : unit;

    return {
      ...item,
      subtotal,
      proporcao: Number(proporcao.toFixed(6)),
      rateioFrete,
      rateioDesconto,
      rateioOutrasDespesas,
      custoTotalItem,
      custoEfetivoUnitario,
    };
  });
}

export default {
  calcularSubtotalItem,
  calcularValorUnitario,
  calcularTotalItens,
  calcularTotalQuantidade,
  calcularTotalNota,
  calcularRateioFreteDesconto,
};
