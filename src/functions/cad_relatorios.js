/**
 * Funções para gerenciamento de relatórios
 * Padrão: POST /relatorios/{recurso}/list com filtros (sem paginação)
 */

/**
 * Lista todas as entradas para o relatório
 * @param {Object} content - Contexto do componente Vue (this)
 * @param {Object} filters - Filtros opcionais (date_from, date_to, setor_id, fornecedor_id)
 */
var listEntradasReport = (content, filters = {}) => {
  console.log("📊 Carregando relatório de entradas: POST /relatorios/entradas/list");

  const payload = {
    filters: {
      ...filters,
    },
  };

  console.log("📋 Payload:", payload);

  return content.$axios
    .post("/relatorios/entradas/list", payload, {
      headers: {
        Authorization: "Bearer " + content.$store.getters["auth/getUserToken"],
        "Content-Type": "application/json",
      },
    })
    .then((response) => {
      console.log("✅ Resposta da API - Relatório Entradas:", response.data);

      if (response.data && response.data.status) {
        // Resposta sem paginação: backend retorna array direto em data
        const entradas = Array.isArray(response.data.data)
          ? response.data.data
          : [];

        console.log(`📊 Entradas encontradas: ${entradas.length} total`);

        // Commit no Vuex store
        content.$store.commit("estoque/setRelatorioEntradas", entradas);
        
        return { 
          success: true, 
          data: entradas,
          total: entradas.length
        };
      } else {
        console.warn("⚠️ Resposta da API sem dados válidos:", response.data);
        content.$store.commit("estoque/setRelatorioEntradas", []);
        return { success: false, data: [], error: response.data.message };
      }
    })
    .catch((error) => {
      console.error("❌ Erro ao carregar relatório de entradas:", error);
      console.error("Resposta de erro:", error.response?.data);

      // Notificação de erro
      try {
        if (content.$toastr && content.$toastr.e) {
          const mensagem =
            error.response?.data?.message ||
            error.response?.data?.error ||
            "Erro ao carregar relatório de entradas";
          content.$toastr.e(mensagem);
        }
      } catch (e) {
        console.warn("Erro ao exibir notificação:", e);
      }

      content.$store.commit("estoque/setRelatorioEntradas", []);
      return { success: false, data: [], error };
    });
};

/**
 * Lista todas as movimentações para o relatório
 * @param {Object} content - Contexto do componente Vue (this)
 * @param {Object} filters - Filtros opcionais (date_from, date_to, tipo, setor_origem_id, setor_destino_id)
 */
var listMovimentacoesReport = (content, filters = {}) => {
  console.log("📊 Carregando relatório de movimentações: POST /relatorios/movimentacoes/list");

  const payload = {
    filters: {
      ...filters,
    },
  };

  console.log("📋 Payload:", payload);

  return content.$axios
    .post("/relatorios/movimentacoes/list", payload, {
      headers: {
        Authorization: "Bearer " + content.$store.getters["auth/getUserToken"],
        "Content-Type": "application/json",
      },
    })
    .then((response) => {
      console.log("✅ Resposta da API - Relatório Movimentações:", response.data);

      if (response.data && response.data.status) {
        // Resposta sem paginação: backend retorna array direto em data
        const movimentacoes = Array.isArray(response.data.data)
          ? response.data.data
          : [];

        console.log(`📊 Movimentações encontradas: ${movimentacoes.length} total`);

        // Commit no Vuex store
        content.$store.commit("estoque/setRelatorioMovimentacoes", movimentacoes);
        
        return { 
          success: true, 
          data: movimentacoes,
          total: movimentacoes.length
        };
      } else {
        console.warn("⚠️ Resposta da API sem dados válidos:", response.data);
        content.$store.commit("estoque/setRelatorioMovimentacoes", []);
        return { success: false, data: [], error: response.data.message };
      }
    })
    .catch((error) => {
      console.error("❌ Erro ao carregar relatório de movimentações:", error);
      console.error("Resposta de erro:", error.response?.data);

      // Notificação de erro
      try {
        if (content.$toastr && content.$toastr.e) {
          const mensagem =
            error.response?.data?.message ||
            error.response?.data?.error ||
            "Erro ao carregar relatório de movimentações";
          content.$toastr.e(mensagem);
        }
      } catch (e) {
        console.warn("Erro ao exibir notificação:", e);
      }

      content.$store.commit("estoque/setRelatorioMovimentacoes", []);
      return { success: false, data: [], error };
    });
};

/**
 * Lista todas as saídas para o relatório
 * @param {Object} content - Contexto do componente Vue (this)
 * @param {Object} filters - Filtros opcionais (date_from, date_to, setor_id, fornecedor_id)
 */
var listSaidasReport = (content, filters = {}) => {
  console.log("📊 Carregando relatório de saídas: POST /relatorios/saidas/list");

  const payload = {
    filters: {
      ...filters,
    },
  };

  console.log("📋 Payload:", payload);

  return content.$axios
    .post("/relatorios/saidas/list", payload, {
      headers: {
        Authorization: "Bearer " + content.$store.getters["auth/getUserToken"],
        "Content-Type": "application/json",
      },
    })
    .then((response) => {
      console.log("✅ Resposta da API - Relatório Saídas:", response.data);

      if (response.data && response.data.status) {
        // Resposta sem paginação: backend retorna array direto em data
        const saidas = Array.isArray(response.data.data)
          ? response.data.data
          : [];

        console.log(`📊 Saídas encontradas: ${saidas.length} total`);

        // Commit no Vuex store
        content.$store.commit("estoque/setRelatorioSaidas", saidas);
        
        return { 
          success: true, 
          data: saidas,
          total: saidas.length
        };
      } else {
        console.warn("⚠️ Resposta da API sem dados válidos:", response.data);
        content.$store.commit("estoque/setRelatorioSaidas", []);
        return { success: false, data: [], error: response.data.message };
      }
    })
    .catch((error) => {
      console.error("❌ Erro ao carregar relatório de saídas:", error);
      console.error("Resposta de erro:", error.response?.data);

      // Notificação de erro
      try {
        if (content.$toastr && content.$toastr.e) {
          const mensagem =
            error.response?.data?.message ||
            error.response?.data?.error ||
            "Erro ao carregar relatório de saídas";
          content.$toastr.e(mensagem);
        }
      } catch (e) {
        console.warn("Erro ao exibir notificação:", e);
      }

      content.$store.commit("estoque/setRelatorioSaidas", []);
      return { success: false, data: [], error };
    });
};


var listSaidasPorDataReport = (content, filters = {}) => {
  console.log("📊 Carregando relatório de saídas por data: POST /relatorios/saidas-por-data/list");

  const payload = {
    filters: {
      ...filters,
    },
  };

  console.log("📋 Payload:", payload);

  return content.$axios
    .post("/relatorios/saidas-por-data/list", payload, {
      headers: {
        Authorization: "Bearer " + content.$store.getters["auth/getUserToken"],
        "Content-Type": "application/json",
      },
    })
    .then((response) => {
      console.log("✅ Resposta da API - Relatório Saídas por Data:", response.data);

      if (response.data && response.data.status) {
        const isPaginated = response.data.data && typeof response.data.data === 'object' && Array.isArray(response.data.data.data);
        const saidasPorData = isPaginated
          ? response.data.data.data
          : (Array.isArray(response.data.data) ? response.data.data : []);
        const periodo = response.data.periodo || null;

        console.log(`📊 Dias com saídas encontrados: ${saidasPorData.length} total`);

        if (periodo) {
          console.log(`📅 Período: ${periodo.data_inicial} até ${periodo.data_final}`);
        }

        // Commit no Vuex store
        content.$store.commit("estoque/setRelatorioSaidasPorData", saidasPorData);
        
        return { 
          success: true, 
          data: response.data.data,
          periodo: periodo,
          total: isPaginated ? response.data.data.total : saidasPorData.length
        };
      } else {
        console.warn("⚠️ Resposta da API sem dados válidos:", response.data);
        content.$store.commit("estoque/setRelatorioSaidasPorData", []);
        return { success: false, data: [], error: response.data.message };
      }
    })
    .catch((error) => {
      console.error("❌ Erro ao carregar relatório de saídas por data:", error);
      console.error("Resposta de erro:", error.response?.data);

      // Notificação de erro
      try {
        if (content.$toastr && content.$toastr.e) {
          const mensagem =
            error.response?.data?.message ||
            error.response?.data?.error ||
            "Erro ao carregar relatório de saídas por data";
          content.$toastr.e(mensagem);
        }
      } catch (e) {
        console.warn("Erro ao exibir notificação:", e);
      }

      content.$store.commit("estoque/setRelatorioSaidasPorData", []);
      return { success: false, data: [], error };
    });
};

var listEntradasPorDataReport = (content, filters = {}) => {
  console.log("📊 Carregando relatório de entradas por data: POST /relatorios/entradas-por-data/list");

  const payload = {
    filters: {
      ...filters,
    },
  };

  console.log("📋 Payload:", payload);

  return content.$axios
    .post("/relatorios/entradas-por-data/list", payload, {
      headers: {
        Authorization: "Bearer " + content.$store.getters["auth/getUserToken"],
        "Content-Type": "application/json",
      },
    })
    .then((response) => {
      console.log("✅ Resposta da API - Relatório Entradas por Data:", response.data);

      if (response.data && response.data.status) {
        // Resposta sem paginação: backend retorna array direto em data
        const entradasPorData = Array.isArray(response.data.data)
          ? response.data.data
          : [];
        const periodo = response.data.periodo || null;

        console.log(`📊 Dias com entradas encontrados: ${entradasPorData.length} total`);

        if (periodo) {
          console.log(`📅 Período: ${periodo.data_inicial} até ${periodo.data_final}`);
        }

        // Commit no Vuex store
        content.$store.commit("estoque/setRelatorioEntradasPorData", entradasPorData);
        
        return { 
          success: true, 
          data: entradasPorData,
          periodo: periodo,
          total: entradasPorData.length
        };
      } else {
        console.warn("⚠️ Resposta da API sem dados válidos:", response.data);
        content.$store.commit("estoque/setRelatorioEntradasPorData", []);
        return { success: false, data: [], error: response.data.message };
      }
    })
    .catch((error) => {
      console.error("❌ Erro ao carregar relatório de entradas por data:", error);
      console.error("Resposta de erro:", error.response?.data);

      // Notificação de erro
      try {
        if (content.$toastr && content.$toastr.e) {
          const mensagem =
            error.response?.data?.message ||
            error.response?.data?.error ||
            "Erro ao carregar relatório de entradas por data";
          content.$toastr.e(mensagem);
        }
      } catch (e) {
        console.warn("Erro ao exibir notificação:", e);
      }

      content.$store.commit("estoque/setRelatorioEntradasPorData", []);
      return { success: false, data: [], error };
    });
};


var listEstoqueReport = (content, filters = {}) => {
  console.log("📊 Carregando relatório de estoque: POST /relatorios/estoque/list");

  const payload = {
    filters: {
      ...filters,
    },
  };

  console.log("📋 Payload:", payload);

  return content.$axios
    .post("/relatorios/estoque/list", payload, {
      headers: {
        Authorization: "Bearer " + content.$store.getters["auth/getUserToken"],
        "Content-Type": "application/json",
      },
    })
    .then((response) => {
      console.log("✅ Resposta da API - Relatório Estoque:", response.data);

      if (response.data && response.data.status) {
        const isPaginated = response.data.data && typeof response.data.data === 'object' && Array.isArray(response.data.data.data);
        const estoque = isPaginated
          ? response.data.data.data
          : (Array.isArray(response.data.data) ? response.data.data : []);

        // Capturar totalizadores da resposta
        const totalizadores = response.data.totalizadores || {
          total_itens: isPaginated ? (response.data.data.total || estoque.length) : estoque.length,
          total_produtos_disponiveis: 0,
          total_produtos_indisponiveis: 0,
          total_abaixo_minimo: 0
        };

        console.log(`📊 Itens de estoque encontrados: ${estoque.length} total`);
        console.log(`📈 Totalizadores:`, totalizadores);

        // Commit no Vuex store
        content.$store.commit("estoque/setRelatorioEstoque", estoque);
        
        return { 
          success: true, 
          data: response.data.data,
          totalizadores: totalizadores,
          total: isPaginated ? response.data.data.total : estoque.length
        };
      } else {
        console.warn("⚠️ Resposta da API sem dados válidos:", response.data);
        content.$store.commit("estoque/setRelatorioEstoque", []);
        return { success: false, data: [], error: response.data.message };
      }
    })
    .catch((error) => {
      console.error("❌ Erro ao carregar relatório de estoque:", error);
      console.error("Resposta de erro:", error.response?.data);

      // Notificação de erro
      try {
        if (content.$toastr && content.$toastr.e) {
          const mensagem =
            error.response?.data?.message ||
            error.response?.data?.error ||
            "Erro ao carregar relatório de estoque";
          content.$toastr.e(mensagem);
        }
      } catch (e) {
        console.warn("Erro ao exibir notificação:", e);
      }

      content.$store.commit("estoque/setRelatorioEstoque", []);
      return { success: false, data: [], error };
    });
};

/**
 * Lista todos os usuários para o relatório
 * @param {Object} content - Contexto do componente Vue (this)
 * @param {Object} filters - Filtros opcionais (status, regime_contratacao_id, setor_id, perfil)
 */
var listUsuariosReport = (content, filters = {}) => {
  console.log("📊 Carregando relatório de usuários: POST /relatorios/usuarios/list");

  const payload = {
    filters: {
      ...filters,
    },
  };

  console.log("📋 Payload:", payload);

  return content.$axios
    .post("/relatorios/usuarios/list", payload, {
      headers: {
        Authorization: "Bearer " + content.$store.getters["auth/getUserToken"],
        "Content-Type": "application/json",
      },
    })
    .then((response) => {
      console.log("✅ Resposta da API - Relatório Usuários:", response.data);

      if (response.data && response.data.status) {
        // Resposta sem paginação: backend retorna array direto em data
        const usuarios = Array.isArray(response.data.data)
          ? response.data.data
          : [];

        console.log(`📊 Usuários encontrados: ${usuarios.length} total`);

        // Commit no Vuex store (opcional)
        content.$store.commit("estoque/setRelatorioUsuarios", usuarios);
        
        return { 
          success: true, 
          data: usuarios,
          total: usuarios.length,
          totalizadores: response.data.totalizadores || null
        };
      } else {
        console.warn("⚠️ Resposta da API sem dados válidos:", response.data);
        content.$store.commit("estoque/setRelatorioUsuarios", []);
        return { success: false, data: [], error: response.data.message };
      }
    })
    .catch((error) => {
      console.error("❌ Erro ao carregar relatório de usuários:", error);
      console.error("Resposta de erro:", error.response?.data);

      // Notificação de erro
      try {
        if (content.$toastr && content.$toastr.e) {
          const mensagem =
            error.response?.data?.message ||
            error.response?.data?.error ||
            "Erro ao carregar relatório de usuários";
          content.$toastr.e(mensagem);
        }
      } catch (e) {
        console.warn("Erro ao exibir notificação:", e);
      }

      content.$store.commit("estoque/setRelatorioUsuarios", []);
      return { success: false, data: [], error };
    });
};

/**
 * Lista o estoque de medicamentos controlados (Portaria 344/98)
 * @param {Object} content - Contexto do componente Vue (this)
 * @param {Object} filters - polo_id, setor_id, grupo_produto_id, lista_portaria,
 *                           produto_id, date_from, date_to, somente_com_saldo
 */
var listMedicamentosControladosReport = (content, filters = {}) => {
  console.log("💊 Carregando relatório de medicamentos controlados: POST /relatorios/medicamentos-controlados/list");

  const payload = {
    filters: {
      ...filters,
    },
  };

  return content.$axios
    .post("/relatorios/medicamentos-controlados/list", payload, {
      headers: {
        Authorization: "Bearer " + content.$store.getters["auth/getUserToken"],
        "Content-Type": "application/json",
      },
    })
    .then((response) => {
      if (response.data && response.data.status) {
        const medicamentos = Array.isArray(response.data.data)
          ? response.data.data
          : [];

        const totalizadores = response.data.totalizadores || {
          total_itens: medicamentos.length,
          total_produtos: 0,
          total_setores: 0,
          quantidade_total: 0,
          total_abaixo_minimo: 0,
          total_lotes_vencidos: 0,
          total_lotes_a_vencer: 0,
          total_entradas_periodo: 0,
          total_saidas_periodo: 0,
          por_lista: {},
        };

        console.log(`💊 Medicamentos controlados encontrados: ${medicamentos.length}`);

        content.$store.commit("estoque/setRelatorioMedicamentosControlados", medicamentos);

        return {
          success: true,
          data: medicamentos,
          totalizadores: totalizadores,
          periodo: response.data.periodo || null,
          total: medicamentos.length,
        };
      }

      console.warn("⚠️ Resposta da API sem dados válidos:", response.data);
      content.$store.commit("estoque/setRelatorioMedicamentosControlados", []);
      return { success: false, data: [], error: response.data.message };
    })
    .catch((error) => {
      console.error("❌ Erro ao carregar relatório de medicamentos controlados:", error);

      try {
        if (content.$toastr && content.$toastr.e) {
          const mensagem =
            error.response?.data?.message ||
            error.response?.data?.error ||
            "Erro ao carregar relatório de medicamentos controlados";
          content.$toastr.e(mensagem);
        }
      } catch (e) {
        console.warn("Erro ao exibir notificação:", e);
      }

      content.$store.commit("estoque/setRelatorioMedicamentosControlados", []);
      return { success: false, data: [], error };
    });
};

/**
 * Exporta o módulo com os métodos públicos
 */
export default {
  listEntradasReport,
  listMovimentacoesReport,
  listSaidasReport,
  listSaidasPorDataReport,
  listEntradasPorDataReport,
  listEstoqueReport,
  listMedicamentosControladosReport,
  listUsuariosReport,
};
