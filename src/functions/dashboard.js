import axios from "axios";

/**
 * Serviço de Integração do Dashboard
 * Consulta as métricas consolidadas diretamente no backend Laravel.
 */

/**
 * Obtém os indicadores agregados e métricas do dashboard para um setor específico.
 *
 * @param {Object|number|string} [params] - Objeto com { setorId, context } ou o próprio setorId
 * @returns {Promise<{ status: boolean, data: { stats: Object, alerts: Array, recentRequests: Array }|null, message?: string }>}
 */
export async function getDashboardMetrics(params = {}) {
  let setorId = null;
  let client = axios;

  if (typeof params === "number" || typeof params === "string") {
    setorId = params;
  } else if (params && typeof params === "object") {
    setorId = params.setorId || params.setor_id || null;
    if (params.context && params.context.$axios) {
      client = params.context.$axios;
    } else if (params.$axios) {
      client = params.$axios;
    }
  }

  try {
    const response = await client.get("/dashboard/metrics", {
      params: setorId ? { setor_id: setorId } : {},
    });

    if (response.data && response.data.status) {
      return {
        status: true,
        data: response.data.data,
      };
    }

    return {
      status: false,
      message: response.data?.message || "Não foi possível carregar as métricas do painel.",
      data: null,
    };
  } catch (error) {
    console.error("Erro ao obter métricas do dashboard:", error);
    return {
      status: false,
      message: error.response?.data?.message || error.message || "Erro de conexão com o servidor.",
      data: null,
    };
  }
}

export default {
  getDashboardMetrics,
};
