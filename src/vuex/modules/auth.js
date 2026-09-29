export default {
  namespaced: true,
  state: {
    userToken: sessionStorage.getItem("token") || localStorage.getItem("token") || null,
    user: JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "null"),
  },
  mutations: {
    setUserToken(state, token) {
      state.userToken = token;
      try {
        if (token) {
          sessionStorage.setItem("token", token);
          localStorage.setItem("token", token);
        } else {
          sessionStorage.removeItem("token");
          localStorage.removeItem("token");
        }
      } catch (e) {
        console.warn("Não foi possível persistir token no storage", e);
      }
    },
    setUser(state, user) {
      state.user = user || null;
      try {
        if (user) {
          const userStr = JSON.stringify(user);
          sessionStorage.setItem("user", userStr);
          localStorage.setItem("user", userStr);
        } else {
          sessionStorage.removeItem("user");
          localStorage.removeItem("user");
        }
      } catch (e) {
        console.warn("Não foi possível persistir usuário no storage", e);
      }
    },
    clearUserToken(state) {
      state.userToken = null;
      try {
        sessionStorage.removeItem("token");
        localStorage.removeItem("token");
      } catch (e) {}
    },
    logout(state) {
      state.userToken = null;
      state.user = null;
      try {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } catch (e) {}
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
