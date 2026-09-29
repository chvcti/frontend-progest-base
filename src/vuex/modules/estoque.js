import { setorCookie } from "@/utils/setorCookie";

export default {
  namespaced: true,
  state: {
    setorAtualId: setorCookie.getSectorId() ? Number(setorCookie.getSectorId()) : null,
    setorAtualNome: setorCookie.getSectorName() || null,
    setorDetails: null,
    listEstoque: [],
    listEstoqueLote: [],
    listMovimentacoes: [],
    listEntradas: [],
    listUsuariosSetor: [],
    setoresConsumidores: [],
    setorConsumidorSelecionado: null,
    setoresComAcesso: [],
    setorAtual: null,
    relatorioEntradas: [],
    relatorioMovimentacoes: [],
    relatorioSaidas: [],
    relatorioSaidasPorData: [],
    relatorioEntradasPorData: [],
    relatorioEstoque: [],
    relatorioMedicamentosControlados: [],
    relatorioUsuarios: [],
  },
  mutations: {
    setSetorAtualId(state, { id, nome }) {
      state.setorAtualId = id;
      state.setorAtualNome = nome;
    },
    clearSetorAtualId(state) {
      state.setorAtualId = null;
      state.setorAtualNome = null;
    },
    setSetorAtual(state, { id, nome }) {
      state.setorAtualId = id;
      state.setorAtualNome = nome;
    },
    clearSetorAtual(state) {
      state.setorAtualId = null;
      state.setorAtualNome = null;
    },
    setSetorDetails(state, details) {
      state.setorDetails = details || null;
      if (details?.id && !state.setorAtualId) {
        state.setorAtualId = Number(details.id);
        state.setorAtualNome = details.nome;
      }
    },
    clearSetorDetails(state) {
      state.setorDetails = null;
    },
    setListEstoque(state, estoque) {
      state.listEstoque = estoque || [];
    },
    clearListEstoque(state) {
      state.listEstoque = [];
    },
    setListEstoqueLote(state, lotes) {
      state.listEstoqueLote = lotes || [];
    },
    clearListEstoqueLote(state) {
      state.listEstoqueLote = [];
    },
    setListMovimentacoes(state, movimentacoes) {
      state.listMovimentacoes = movimentacoes || [];
    },
    clearListMovimentacoes(state) {
      state.listMovimentacoes = [];
    },
    setListEntradas(state, entradas) {
      state.listEntradas = entradas || [];
    },
    clearListEntradas(state) {
      state.listEntradas = [];
    },
    setListUsuariosSetor(state, usuarios) {
      state.listUsuariosSetor = usuarios || [];
    },
    clearListUsuariosSetor(state) {
      state.listUsuariosSetor = [];
    },
    setSetoresConsumidores(state, setores) {
      state.setoresConsumidores = setores || [];
    },
    clearSetoresConsumidores(state) {
      state.setoresConsumidores = [];
    },
    setSetorConsumidorSelecionado(state, setor) {
      state.setorConsumidorSelecionado = setor || null;
    },
    clearSetorConsumidorSelecionado(state) {
      state.setorConsumidorSelecionado = null;
    },
    setSetoresComAcesso(state, setores) {
      state.setoresComAcesso = setores || [];
    },
    setSetorAtualCompat(state, setor) {
      state.setorAtual = setor;
    },
    setRelatorioEntradas(state, entradas) {
      state.relatorioEntradas = entradas || [];
    },
    clearRelatorioEntradas(state) {
      state.relatorioEntradas = [];
    },
    setRelatorioMovimentacoes(state, movimentacoes) {
      state.relatorioMovimentacoes = movimentacoes || [];
    },
    clearRelatorioMovimentacoes(state) {
      state.relatorioMovimentacoes = [];
    },
    setRelatorioSaidas(state, saidas) {
      state.relatorioSaidas = saidas || [];
    },
    clearRelatorioSaidas(state) {
      state.relatorioSaidas = [];
    },
    setRelatorioSaidasPorData(state, saidasPorData) {
      state.relatorioSaidasPorData = saidasPorData || [];
    },
    clearRelatorioSaidasPorData(state) {
      state.relatorioSaidasPorData = [];
    },
    setRelatorioEntradasPorData(state, entradasPorData) {
      state.relatorioEntradasPorData = entradasPorData || [];
    },
    clearRelatorioEntradasPorData(state) {
      state.relatorioEntradasPorData = [];
    },
    setRelatorioEstoque(state, estoque) {
      state.relatorioEstoque = estoque || [];
    },
    clearRelatorioEstoque(state) {
      state.relatorioEstoque = [];
    },
    setRelatorioMedicamentosControlados(state, medicamentos) {
      state.relatorioMedicamentosControlados = medicamentos || [];
    },
    clearRelatorioMedicamentosControlados(state) {
      state.relatorioMedicamentosControlados = [];
    },
    setRelatorioUsuarios(state, usuarios) {
      state.relatorioUsuarios = usuarios || [];
    },
    clearRelatorioUsuarios(state) {
      state.relatorioUsuarios = [];
    },
  },
  actions: {},
  getters: {
    getSetorAtualId: (state) => state.setorAtualId,
    getSetorAtualNome: (state) => state.setorAtualNome,
    getSetorDetails: (state) => state.setorDetails,
    getListEstoque: (state) => state.listEstoque,
    getListEstoqueLote: (state) => state.listEstoqueLote,
    getListMovimentacoes: (state) => state.listMovimentacoes,
    getListEntradas: (state) => state.listEntradas,
    getListUsuariosSetor: (state) => state.listUsuariosSetor,
    getSetoresConsumidores: (state) => state.setoresConsumidores,
    getSetorConsumidorSelecionado: (state) => state.setorConsumidorSelecionado,
    getSetoresComAcesso: (state) => state.setoresComAcesso,
    getRelatorioEntradas: (state) => state.relatorioEntradas,
    getRelatorioMovimentacoes: (state) => state.relatorioMovimentacoes,
    getRelatorioSaidas: (state) => state.relatorioSaidas,
    getRelatorioSaidasPorData: (state) => state.relatorioSaidasPorData,
    getRelatorioMedicamentosControlados: (state) => state.relatorioMedicamentosControlados,
  },
};
