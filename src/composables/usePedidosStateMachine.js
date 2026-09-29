import { ref, computed } from "vue";
import axios from "axios";
import { useToast } from "@/components/ui/toast/use-toast";
import store from "@/vuex/store";

/**
 * Composable que encapsula a Máquina de Estados para transições de status de pedidos/movimentações.
 *
 * Estados suportados:
 * - Rascunho ('C') -> Pendente ('P'): enviarParaAnalise
 * - Pendente ('P') -> Cancelado ('X'): cancelarPedido
 * - Rascunho ('C') -> Excluído: excluirRascunho
 * - Pendente ('P') -> Atendido ('A'): aprovarPedido
 * - Pendente ('P') -> Negado ('R'): rejeitarPedido
 *
 * @param {Function} [onSuccessCallback] Função de recarregamento dos dados da tabela/lista executada após transição bem-sucedida.
 */
export function usePedidosStateMachine(onSuccessCallback) {
  const actionInProgress = ref(null);
  const erro = ref(null);

  const isLoadingAcao = computed(() => !!actionInProgress.value);

  const toastContext = (() => {
    try {
      return useToast();
    } catch {
      return null;
    }
  })();

  const dispararToast = ({ title, description, variant = "default" }) => {
    if (toastContext?.toast) {
      toastContext.toast({ title, description, variant });
    } else {
      console.log(`[usePedidosStateMachine] ${title}: ${description}`);
    }
  };

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      store?.getters?.["auth/getUserToken"] ||
      store?.getters?.getUserToken ||
      store?.state?.auth?.userToken ||
      ""
    );
  };

  const getHeaders = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const extrairId = (pedidoOrId) => {
    if (pedidoOrId && typeof pedidoOrId === "object") {
      return pedidoOrId.id;
    }
    return pedidoOrId;
  };

  /**
   * Promove o pedido do estado de Rascunho ('C') para Pendente ('P') para análise.
   * @param {Object|number|string} pedidoOrId
   * @returns {Promise<boolean>}
   */
  const enviarParaAnalise = async (pedidoOrId) => {
    const id = extrairId(pedidoOrId);
    if (!id) return false;

    actionInProgress.value = id;
    erro.value = null;

    try {
      const response = await axios.post(
        `/movimentacao/${id}/process`,
        { action: "submit", status: "P" },
        { headers: getHeaders() }
      );

      if (response.data && response.data.status !== false) {
        dispararToast({
          title: "Sucesso",
          description: `Rascunho #${id} enviado com sucesso para análise!`,
        });
        if (typeof onSuccessCallback === "function") {
          await onSuccessCallback();
        }
        return true;
      } else {
        throw new Error(response.data?.message || "Não foi possível enviar o rascunho.");
      }
    } catch (error) {
      console.error(`[usePedidosStateMachine] Erro ao enviar rascunho #${id}:`, error);
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Não foi possível enviar o rascunho para análise.";
      erro.value = msg;
      dispararToast({
        title: "Erro",
        description: msg,
        variant: "destructive",
      });
      return false;
    } finally {
      actionInProgress.value = null;
    }
  };

  /**
   * Cancela uma solicitação/pedido pendente.
   * @param {Object|number|string} pedidoOrId
   * @param {string} [motivo]
   * @returns {Promise<boolean>}
   */
  const cancelarPedido = async (pedidoOrId, motivo = "") => {
    const id = extrairId(pedidoOrId);
    if (!id) return false;

    actionInProgress.value = id;
    erro.value = null;

    try {
      const payload = { action: "cancel", status: "X" };
      if (motivo) {
        payload.justificativa = motivo;
      }

      const response = await axios.post(
        `/movimentacao/${id}/process`,
        payload,
        { headers: getHeaders() }
      );

      if (response.data && response.data.status !== false) {
        dispararToast({
          title: "Sucesso",
          description: "Pedido cancelado com sucesso.",
        });
        if (typeof onSuccessCallback === "function") {
          await onSuccessCallback();
        }
        return true;
      } else {
        throw new Error(response.data?.message || "Não foi possível cancelar o pedido.");
      }
    } catch (error) {
      console.error(`[usePedidosStateMachine] Erro ao cancelar pedido #${id}:`, error);
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Não foi possível cancelar o pedido.";
      erro.value = msg;
      dispararToast({
        title: "Erro",
        description: msg,
        variant: "destructive",
      });
      return false;
    } finally {
      actionInProgress.value = null;
    }
  };

  /**
   * Exclui fisicamente um rascunho de pedido/movimentação.
   * @param {Object|number|string} pedidoOrId
   * @returns {Promise<boolean>}
   */
  const excluirRascunho = async (pedidoOrId) => {
    const id = extrairId(pedidoOrId);
    if (!id) return false;

    actionInProgress.value = id;
    erro.value = null;

    try {
      const response = await axios.post(
        `/movimentacao/${id}/delete`,
        {},
        { headers: getHeaders() }
      );

      if (response.data && response.data.status !== false) {
        dispararToast({
          title: "Sucesso",
          description: "Rascunho excluído com sucesso.",
        });
        if (typeof onSuccessCallback === "function") {
          await onSuccessCallback();
        }
        return true;
      } else {
        throw new Error(response.data?.message || "Não foi possível excluir o rascunho.");
      }
    } catch (error) {
      console.error(`[usePedidosStateMachine] Erro ao excluir rascunho #${id}:`, error);
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Não foi possível excluir o rascunho.";
      erro.value = msg;
      dispararToast({
        title: "Erro",
        description: msg,
        variant: "destructive",
      });
      return false;
    } finally {
      actionInProgress.value = null;
    }
  };

  /**
   * Aprova uma movimentação com liberação de itens.
   * @param {Object|number|string} pedidoOrId
   * @param {Array} [itens]
   * @returns {Promise<boolean>}
   */
  const aprovarPedido = async (pedidoOrId, itens = []) => {
    const id = extrairId(pedidoOrId);
    if (!id) return false;

    actionInProgress.value = id;
    erro.value = null;

    try {
      const payload = { action: "approve", status: "A" };
      if (Array.isArray(itens) && itens.length > 0) {
        payload.itens = itens.map((it) => ({
          id: it.id,
          quantidade_liberada: Number(it.quantidade_liberada) || 0,
        }));
      }

      const response = await axios.post(
        `/movimentacao/${id}/process`,
        payload,
        { headers: getHeaders() }
      );

      if (response.data && response.data.status !== false) {
        dispararToast({
          title: "Sucesso",
          description: "Movimentação aprovada com sucesso.",
        });
        if (typeof onSuccessCallback === "function") {
          await onSuccessCallback();
        }
        return true;
      } else {
        throw new Error(response.data?.message || "Não foi possível aprovar a movimentação.");
      }
    } catch (error) {
      console.error(`[usePedidosStateMachine] Erro ao aprovar pedido #${id}:`, error);
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Não foi possível aprovar a movimentação.";
      erro.value = msg;
      dispararToast({
        title: "Erro",
        description: msg,
        variant: "destructive",
      });
      return false;
    } finally {
      actionInProgress.value = null;
    }
  };

  /**
   * Rejeita uma movimentação.
   * @param {Object|number|string} pedidoOrId
   * @param {string} [motivo]
   * @returns {Promise<boolean>}
   */
  const rejeitarPedido = async (pedidoOrId, motivo = "") => {
    const id = extrairId(pedidoOrId);
    if (!id) return false;

    actionInProgress.value = id;
    erro.value = null;

    try {
      const payload = { action: "reject", status: "R" };
      if (motivo) {
        payload.motivo_rejeicao = motivo;
      }

      const response = await axios.post(
        `/movimentacao/${id}/process`,
        payload,
        { headers: getHeaders() }
      );

      if (response.data && response.data.status !== false) {
        dispararToast({
          title: "Sucesso",
          description: "Movimentação rejeitada.",
        });
        if (typeof onSuccessCallback === "function") {
          await onSuccessCallback();
        }
        return true;
      } else {
        throw new Error(response.data?.message || "Não foi possível rejeitar a movimentação.");
      }
    } catch (error) {
      console.error(`[usePedidosStateMachine] Erro ao rejeitar pedido #${id}:`, error);
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Não foi possível rejeitar a movimentação.";
      erro.value = msg;
      dispararToast({
        title: "Erro",
        description: msg,
        variant: "destructive",
      });
      return false;
    } finally {
      actionInProgress.value = null;
    }
  };

  return {
    actionInProgress,
    isLoadingAcao,
    erro,
    enviarParaAnalise,
    cancelarPedido,
    excluirRascunho,
    aprovarPedido,
    rejeitarPedido,
  };
}
