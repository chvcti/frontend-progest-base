import { createStore } from "vuex";
import auth from "./modules/auth";
import cadastros from "./modules/cadastros";
import estoque from "./modules/estoque";

export default createStore({
  modules: {
    auth,
    cadastros,
    estoque,
  },
  state: {
    pageTitle: null,
    pageSubtitle: null,
    modalData: {
      modalTitle: "",
      modalFunction: "ADD",
      modalData: {},
      isModalOpen: false,
    },
    modalErrors: {},
    searchFilters: [],
    idDataLoaded: "",
    isSearching: "",
  },
  mutations: {
    setPageHeader(state, payload) {
      state.pageTitle = payload?.title || null;
      state.pageSubtitle = payload?.subtitle || null;
    },
    clearPageHeader(state) {
      state.pageTitle = null;
      state.pageSubtitle = null;
    },
    setModalData(state, payload) {
      state.modalData.modalData = { ...state.modalData.modalData, ...payload };
    },
    resetModalData(state) {
      state.modalData.modalData = {
        status: "A",
        name: "",
        cpf: "",
        email: "",
        telefone: "",
        data_nascimento: "",
        regime_contratacao_id: "",
        password: "",
      };
    },
    SET_MODAL_DATA(state, payload) {
      state.modalData.modalTitle = payload.modalTitle || "";
      state.modalData.modalData = payload.modalData || {};
      state.modalData.modalFunction = payload.modalFunction || "ADD";
    },
    setModalTitle(state, title) {
      state.modalData.modalTitle = title;
    },
    setModalFunction(state, func) {
      state.modalData.modalFunction = func;
    },
    setModalErrors(state, errors) {
      state.modalErrors = errors || {};
    },
    setModalOpen(state, isOpen) {
      state.modalData.isModalOpen = isOpen;
    },
    setIdDataLoaded(state, id) {
      state.idDataLoaded = id;
    },
    setisSearching(state, id) {
      state.isSearching = id;
    },
  },
  actions: {},
  getters: {
    getModalData: (state) => state.modalData.modalData,
    getModalTitle: (state) => state.modalData.modalTitle,
    getModalFunction: (state) => state.modalData.modalFunction,
    getModalErrors: (state) => state.modalErrors,
  },
});
