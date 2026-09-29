/**
 * Utilitário Analítico de Cálculo FIFO (First In, First Out)
 * Realiza o abatimento e alocação de lotes em ordem cronológica de disponibilidade.
 */

/**
 * Calcula a alocação de lotes por FIFO dada uma quantidade necessária.
 *
 * @param {Array} lotesDisponiveis - Lista de lotes com quantidade_disponivel
 * @param {number} quantidadeNecessaria - Quantidade total a ser alocada
 * @returns {{ lotes_alocados: Array, quantidade_sem_cobertura: number }}
 */
export function calcularAlocacaoFifo(lotesDisponiveis = [], quantidadeNecessaria = 0) {
  const qtdNecessaria = Number(quantidadeNecessaria) || 0;
  if (qtdNecessaria <= 0) {
    return {
      lotes_alocados: [],
      quantidade_sem_cobertura: 0,
    };
  }

  let restante = qtdNecessaria;
  const lotesAlocados = [];

  for (const lote of lotesDisponiveis || []) {
    if (restante <= 0) break;
    const saldoLote = Number(lote.quantidade_disponivel) || 0;
    if (saldoLote <= 0) continue;

    const qtdUsar = Math.min(saldoLote, restante);
    lotesAlocados.push({
      ...lote,
      quantidade_a_usar: qtdUsar,
    });
    restante -= qtdUsar;
  }

  return {
    lotes_alocados: lotesAlocados,
    quantidade_sem_cobertura: Math.max(0, restante),
  };
}
