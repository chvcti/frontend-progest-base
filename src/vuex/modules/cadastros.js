export default {
  namespaced: true,
  state: {
    listSetores: [],
    listSetoresGerais: [],
    listProdutos: [],
    listUnidadesMedida: [],
    listGrupoProdutos: [],
    listFornecedores: [],
    listPolos: [],
    listPerfis: [],
    listRegimesContratacao: [],
    gruposProdutos: [],
    unidadesMedidaAux: [],
    listUsers: [],
    listTiposUsuario: [],
  },
  mutations: {
    setListSetores(state, setores) {
      state.listSetores = setores;
    },
    setListSetoresGerais(state, setores) {
      state.listSetoresGerais = setores;
    },
    setListProdutos(state, produtos) {
      state.listProdutos = produtos;
    },
    setListGrupoProdutos(state, grupos) {
      state.listGrupoProdutos = grupos;
    },
    SET_listUnidadesMedida(state, unidadesMedida) {
      state.listUnidadesMedida = unidadesMedida;
    },
    setListFornecedores(state, fornecedores) {
      state.listFornecedores = fornecedores;
    },
    setListPolos(state, polos) {
      state.listPolos = polos || [];
    },
    setListPerfis(state, perfis) {
      state.listPerfis = perfis;
    },
    setListRegimesContratacao(state, RegimesContratacao) {
      state.listRegimesContratacao = RegimesContratacao || [];
    },
    setGruposProdutos(state, grupos) {
      state.gruposProdutos = grupos;
    },
    setUnidadesMedidaAux(state, unidades) {
      state.unidadesMedidaAux = unidades;
    },
    setListUsers(state, users) {
      state.listUsers = users;
    },
    setListTiposUsuario(state, users) {
      state.listTiposUsuario = users;
    },
  },
  actions: {},
  getters: {
    getListUsers: (state) => state.listUsers,
    getListTiposUsuario: (state) => state.listTiposUsuario,
    getListProdutos: (state) => state.listProdutos,
    GET_listUnidadesMedida: (state) => state.listUnidadesMedida,
    getListGrupoProdutos: (state) => state.listGrupoProdutos,
    getListFornecedores: (state) => state.listFornecedores,
    getListPolos: (state) => state.listPolos,
    getListPerfis: (state) => state.listPerfis,
    getListRegimesContratacao: (state) => state.listRegimesContratacao,
  },
};
