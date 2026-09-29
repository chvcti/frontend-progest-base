/**
 * Utilitário de Governança e Permissões de Movimentações
 * Contém funções puras para validar regras de negócio de aprovação, cancelamento,
 * edição de rascunho e devolução de pedidos/transferências.
 */

/**
 * Determina se a movimentação é de entrada para o setor especificado.
 *
 * @param {Object} mov - Objeto de movimentação
 * @param {number|string} setorAtualId - ID do setor atual
 * @returns {boolean}
 */
export function isEntradaMovimentacao(mov, setorAtualId) {
  if (!mov || !setorAtualId) return false;
  const sid = Number(setorAtualId);
  return Number(mov.setor_destino_id) === sid || Number(mov.setorDestino?.id) === sid;
}

/**
 * Determina se a movimentação é de saída para o setor especificado.
 *
 * @param {Object} mov - Objeto de movimentação
 * @param {number|string} setorAtualId - ID do setor atual
 * @returns {boolean}
 */
export function isSaidaMovimentacao(mov, setorAtualId) {
  if (!mov || !setorAtualId) return false;
  const sid = Number(setorAtualId);
  return Number(mov.setor_origem_id) === sid || Number(mov.setorOrigem?.id) === sid;
}

/**
 * Regra de negócio para aprovação de movimentação:
 * - Status deve ser 'P' (Pendente)
 * - Usuário deve ter permissão de aprovação (Admin ou Almoxarife)
 * - Em devoluções ('D'): quem aprova é o setor de destino (quem recebe de volta)
 * - Em transferências/solicitações: quem aprova é o setor de origem (quem fornece o item)
 *
 * @param {Object} mov - Objeto de movimentação
 * @param {number|string} setorAtualId - ID do setor atual
 * @param {boolean|Object} temPermissao - Booleano de permissão ou objeto { isAdmin, isAlmoxarife }
 * @returns {boolean}
 */
export function podeAprovarMovimentacao(mov, setorAtualId, temPermissao = false) {
  if (!mov || mov.status_solicitacao !== "P" || !setorAtualId) return false;

  const hasPermission = typeof temPermissao === "object" && temPermissao !== null
    ? Boolean(temPermissao.isAdmin || temPermissao.isAlmoxarife)
    : Boolean(temPermissao);

  if (!hasPermission) return false;

  const currentSetorId = Number(setorAtualId);
  const isDestino = Number(mov.setor_destino_id || mov.setorDestino?.id) === currentSetorId;
  const isOrigem = Number(mov.setor_origem_id || mov.setorOrigem?.id) === currentSetorId;

  if (mov.tipo === "D") {
    return isDestino;
  }
  return isOrigem;
}

/**
 * Regra de negócio para cancelamento de movimentação pendente:
 * - Status deve ser 'P' (Pendente)
 * - Em devoluções ('D'): quem cancela é a origem (quem solicitou a devolução)
 * - Em transferências comuns: quem cancela é o destino (quem fez o pedido)
 *
 * @param {Object} mov - Objeto de movimentação
 * @param {number|string} setorAtualId - ID do setor atual
 * @returns {boolean}
 */
export function podeCancelarMovimentacao(mov, setorAtualId) {
  if (!mov || mov.status_solicitacao !== "P" || !setorAtualId) return false;

  const currentSetorId = Number(setorAtualId);
  const isDestino = Number(mov.setor_destino_id || mov.setorDestino?.id) === currentSetorId;
  const isOrigem = Number(mov.setor_origem_id || mov.setorOrigem?.id) === currentSetorId;

  if (mov.tipo === "D") {
    return isOrigem;
  }
  return isDestino;
}

/**
 * Regra de negócio para edição de rascunhos de pedidos:
 * - Status deve ser 'C' (Rascunho)
 * - Se for devolução ('D'), o setor atual deve ser a origem (saída)
 * - Se for transferência comum, o setor atual deve ser o destino (entrada/solicitante)
 *
 * @param {Object} mov - Objeto de movimentação
 * @param {number|string} setorAtualId - ID do setor atual
 * @returns {boolean}
 */
export function podeEditarRascunho(mov, setorAtualId) {
  if (!mov || mov.status_solicitacao !== "C" || !setorAtualId) return false;

  if (mov.tipo === "D") {
    return isSaidaMovimentacao(mov, setorAtualId);
  }
  return isEntradaMovimentacao(mov, setorAtualId);
}

/**
 * Regra de negócio para devolução de pedidos:
 * - Status deve ser 'A' (Aprovada)
 * - Não pode ser uma movimentação que já é do tipo devolução ('D')
 * - O setor atual deve ser o destino que recebeu os itens (entrada)
 *
 * @param {Object} mov - Objeto de movimentação
 * @param {number|string} setorAtualId - ID do setor atual
 * @returns {boolean}
 */
export function podeDevolverMovimentacao(mov, setorAtualId) {
  if (!mov || mov.status_solicitacao !== "A" || mov.tipo === "D" || !setorAtualId) return false;
  return isEntradaMovimentacao(mov, setorAtualId);
}
