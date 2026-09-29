export default {
  namespaced: true,
  state: {
    userToken: sessionStorage.getItem("token") || null,
    user: JSON.parse(sessionStorage.getItem("user") || "null"),
  },
  mutations: {
    setUserToken(state, token) {
      state.userToken = token;
      sessionStorage.setItem("token", token);
    },
    setUser(state, user) {
      state.user = user || null;
      try {
        if (user) sessionStorage.setItem("user", JSON.stringify(user));
        else sessionStorage.removeItem("user");
      } catch (e) {
        console.warn("Não foi possível persistir usuário no sessionStorage", e);
      }
    },
    clearUserToken(state) {
      state.userToken = null;
      sessionStorage.removeItem("token");
    },
    logout(state) {
      state.userToken = null;
      state.user = null;
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
    },
  },
  actions: {
    logout({ commit }) {
      commit("logout");
    },
  },
  getters: {
    getUserToken: (state) => state.userToken,
    getUser: (state) => state.user,
    isSuperAdmin: (state) => {
      const u = state.user;
      if (!u) return false;
      return Boolean(u.is_super_admin);
    },
    isAdmin: (state) => {
      const u = state.user;
      if (!u) return false;
      return Boolean(u.is_super_admin) || Boolean(u.is_admin);
    },
  },
};
