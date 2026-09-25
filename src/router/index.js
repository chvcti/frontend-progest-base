import { createRouter, createWebHistory } from "vue-router";
import Login from "../views/Login.vue";
import Register from "../views/Register.vue";
import SetorSelectionView from "../views/SetorSelectionView.vue";
import PedidosView from "@/views/roleSolicitante/PedidosView.vue";
import SetorAtualView from "@/views/SetorAtualView.vue";
import { setorCookie } from "@/utils/setorCookie";
import axios from "axios";
import store from "@/vuex/store";
import functionsSetor from "@/functions/cad_setores";
import functionsUsuarioSetor from "@/functions/cad_usuario_setor";

// cadastros
import Home from "@/views/Home.vue";
import Users from "../views/cadastros/Users.vue";

import SetorDetalhes from "../views/cadastros/SetorDetalhes.vue";
import Produtos from "../views/cadastros/Produtos.vue";
import UnidadesMedida from "../views/cadastros/UnidadesMedida.vue";
import Fornecedores from "../views/cadastros/Fornecedores.vue";
import GrupoProduto from "../views/cadastros/GrupoProduto.vue";
import Polos from "../views/cadastros/Polos.vue";
import Setores from "../views/cadastros/Setores.vue";
import Perfis from "../views/cadastros/Perfis.vue";
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "login",
      component: Login,
    },
    {
      path: "/register",
      name: "register",
      component: Register,
    },
    {
      path: "/setor-selection",
      name: "setorSelection",
      component: SetorSelectionView,
      meta: { requiresAuth: true, requiresSector: false },
    },
    {
      path: "/home",
      name: "home",
      component: Home,
    },
    {
      path: "/setor-atual",
      name: "setorAtual",
      component: SetorAtualView,
      meta: { requiresAuth: true, requiresSector: true },
    },
    {
      path: "/users",
      name: "users",
      component: Users,
      meta: { requiresAuth: true, requiresSector: true, roles: ['admin'] },
    },

    {
      path: "/setor/:id",
      name: "setorDetalhes",
      component: SetorDetalhes,
      meta: { requiresAuth: true, requiresSector: true, roles: ['admin'] },
      props: true,
    },
    {
      path: "/perfis",
      name: "perfis",
      component: Perfis,
      meta: { requiresAuth: true, requiresSector: true, roles: ['admin'] },
    },
    {
      path: "/dashboard",
      name: "dashboard",
      redirect: "/setor-atual",
      meta: { requiresAuth: true, requiresSector: true },
    },
    {
      path: "/produtos/novo",
      name: "produtosNovo",
      component: Produtos,
      meta: { requiresAuth: true, requiresSector: true, roles: ['admin'] },
    },
    {
      path: "/entradas/nova",
      name: "entradasNova",
      redirect: "/setor-atual?tab=entrada",
      meta: { requiresAuth: true, requiresSector: true, roles: ['admin'] },
    },
    {
      path: "/produtos",
      name: "produtos",
      component: Produtos,
      meta: { requiresAuth: true, requiresSector: true, roles: ['admin'] },
    },
    {
      path: "/pedidos",
      name: "pedidos",
      component: PedidosView,
      meta: { requiresAuth: true, requiresSector: true, forbiddenForCAF: true },
    },
    /* categoriasProdutos removed in favor of grupoProduto */
    {
      path: "/grupoProduto",
      name: "grupoProduto",
      component: GrupoProduto,
      meta: { requiresAuth: true, requiresSector: true, roles: ['admin'] },
    },
    {
      path: "/unidadesMedida",
      name: "unidadesMedida",
      component: UnidadesMedida,
      meta: { requiresAuth: true, requiresSector: true, roles: ['admin'] },
    },
    {
      path: "/fornecedores",
      name: "fornecedores",
      component: Fornecedores,
      meta: { requiresAuth: true, requiresSector: true, roles: ['admin'] },
    },
    {
      path: "/polos",
      name: "polos",
      component: Polos,
      meta: { requiresAuth: true, requiresSector: true, globalAdminOnly: true },
    },
    {
      path: "/setores",
      name: "setores",
      component: Setores,
      meta: { requiresAuth: true, requiresSector: true, allowAdminSetores: true, roles: ['admin'] },
    },

    // Relatórios (placeholders / views de relatórios)
    {
      path: "/relatorios",
      name: "relatorios",
      component: () => import("@/views/relatorios/Relatorios.vue"),
      meta: { requiresAuth: true, requiresSector: true, roles: ['admin', 'almoxarife'] },
    },
    {
      path: "/relatorios/entradas",
      name: "relatoriosEntradas",
      component: () => import("@/views/relatorios/EntradasReport.vue"),
      meta: { requiresAuth: true, requiresSector: true, roles: ['admin', 'almoxarife'] },
    },
    {
      path: "/relatorios/movimentacoes",
      name: "relatoriosMovimentacoes",
      component: () => import("@/views/relatorios/MovimentacoesReport.vue"),
      meta: { requiresAuth: true, requiresSector: true, roles: ['admin', 'almoxarife'] },
    },
    {
      path: "/relatorios/saidas",
      name: "relatoriosSaidas",
      component: () => import("@/views/relatorios/SaidasReport.vue"),
      meta: { requiresAuth: true, requiresSector: true, roles: ['admin', 'almoxarife'] },
    },
    {
      path: "/relatorios/saidas-por-data",
      name: "relatoriosSaidasPorData",
      component: () => import("@/views/relatorios/SaidasPorDataReport.vue"),
      meta: { requiresAuth: true, requiresSector: true, roles: ['admin', 'almoxarife'] },
    },
    {
      path: "/relatorios/entradas-por-data",
      name: "relatoriosEntradasPorData",
      component: () => import("@/views/relatorios/EntradasPorDataReport.vue"),
      meta: { requiresAuth: true, requiresSector: true, roles: ['admin', 'almoxarife'] },
    },
    {
      path: "/relatorios/estoque",
      name: "relatoriosEstoque",
      component: () => import("@/views/relatorios/EstoqueReport.vue"),
      meta: { requiresAuth: true, requiresSector: true, roles: ['admin', 'almoxarife'] },
    },
    {
      path: "/relatorios/medicamentos-controlados",
      name: "relatoriosMedicamentosControlados",
      component: () => import("@/views/relatorios/MedicamentosControladosReport.vue"),
      meta: { requiresAuth: true, requiresSector: true, roles: ['admin', 'almoxarife'] },
    },
    {
      path: "/relatorios/usuarios",
      name: "relatoriosUsuarios",
      component: () => import("@/views/relatorios/UsuariosReport.vue"),
      meta: { requiresAuth: true, requiresSector: true, roles: ['admin'] },
    },
    {
      path: "/relatorios/financeiro",
      name: "relatoriosFinanceiro",
      component: () => import("@/views/relatorios/RelatoriosFinanceirosView.vue"),
      meta: { requiresAuth: true, requiresSector: true, roles: ['admin'] },
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: (to) => {
        const isAuthenticated = localStorage.getItem("token");
        return isAuthenticated ? "/setor-atual" : "/login";
      },
    },
    {
      path: "/setores-consumidores",
      name: "SetoresConsumidoresList",
      component: () => import("../views/SetoresConsumidoresListView.vue"),
      meta: { requiresAuth: true, requiresSector: true, roles: ['admin'] },
    },
    {
      path: "/setores-consumidores/:id",
      name: "SetorConsumidor",
      component: () => import("../views/SetorConsumidorView.vue"),
      meta: { requiresAuth: true, requiresSector: true, roles: ['admin'] },
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  const isAuthenticated = localStorage.getItem("token");
  const hasSector = setorCookie.hasSector();

  // Helper to determine if logged user is 'solicitante' for the current sector
  const checkIsSolicitante = async () => {
    const user = store.state.user;
    if (!user) return false;

    try {
      let list = store.state.listUsuariosSetor || [];

      // If not loaded yet, try to fetch user-setor vínculos
      if (
        (!list || list.length === 0) &&
        functionsUsuarioSetor &&
        functionsUsuarioSetor.listAll
      ) {
        try {
          await functionsUsuarioSetor.listAll({ $axios: axios, $store: store });
          list = store.state.listUsuariosSetor || [];
        } catch (e) {
          console.warn(
            "checkIsSolicitante: erro ao carregar usuarios do setor",
            e,
          );
        }
      }

      const found = list.find((u) => {
        const userId =
          u.usuario_id || u.user_id || u.id || (u.usuario && u.usuario.id);
        const perfil = (u.perfil || (u.pivot && u.pivot.perfil) || "")
          .toString()
          .toLowerCase();
        return (
          userId === user.id &&
          (perfil === "solicitante" || perfil.includes("solicitante"))
        );
      });

      if (found) return true;
    } catch (e) {
      console.warn("Erro ao avaliar solicitante no guard:", e);
    }

    // fallback to roles/perfil on user object
    const userObj = store.state.user || {};
    if (
      (userObj.roles &&
        userObj.roles.includes &&
        userObj.roles.includes("solicitante")) ||
      (userObj.perfil &&
        userObj.perfil.toString().toLowerCase().includes("solicitante"))
    )
      return true;

    return false;
  };

  // Helper to determine if logged user is 'almoxarife' for the current sector
  const checkIsAlmoxarife = async () => {
    const user = store.state.user;
    if (!user) return false;

    try {
      let list = store.state.listUsuariosSetor || [];

      // If not loaded yet, try to fetch user-setor vínculos
      if (
        (!list || list.length === 0) &&
        functionsUsuarioSetor &&
        functionsUsuarioSetor.listAll
      ) {
        try {
          await functionsUsuarioSetor.listAll({ $axios: axios, $store: store });
          list = store.state.listUsuariosSetor || [];
        } catch (e) {
          console.warn(
            "checkIsAlmoxarife: erro ao carregar usuarios do setor",
            e,
          );
        }
      }

      const found = list.find((u) => {
        const userId =
          u.usuario_id || u.user_id || u.id || (u.usuario && u.usuario.id);
        const perfil = (u.perfil || (u.pivot && u.pivot.perfil) || "")
          .toString()
          .toLowerCase();
        return (
          userId === user.id &&
          (perfil === "almoxarife" || perfil.includes("almoxarife"))
        );
      });

      if (found) return true;
    } catch (e) {
      console.warn("Erro ao avaliar almoxarife no guard:", e);
    }

    // fallback to roles/perfil on user object
    const userObj = store.state.user || {};
    if (
      (userObj.roles &&
        userObj.roles.includes &&
        userObj.roles.includes("almoxarife")) ||
      (userObj.perfil &&
        userObj.perfil.toString().toLowerCase().includes("almoxarife"))
    )
      return true;

    return false;
  };

  // Se a rota requer autenticação e não está autenticado
  if (to.meta.requiresAuth && !isAuthenticated) {
    setorCookie.clearSector();
    next("/login");
    return;
  }

  // Se está autenticado e tenta acessar login/register, redirecionar para seleção de setor ou dashboard
  if (isAuthenticated && (to.path === "/login" || to.path === "/register")) {
    if (hasSector) {
      // Redireciona para setor-atual
      next("/setor-atual");
    } else {
      next("/setor-selection");
    }
    return;
  }

  // Se a rota requer setor selecionado e não tem
  if (to.meta.requiresSector && !hasSector) {
    const userObj = store.state.user || JSON.parse(localStorage.getItem('user') || '{}');
    const isGlobalAdmin = userObj && (
      userObj.email === "admin@admin.com" || userObj.email === "adminti@gmail.com" || userObj.is_super_admin || 
      userObj.email === "adminti@gmail.com" || 
      !!userObj.is_admin || 
      !!userObj.is_super_admin
    );
    
    if (isGlobalAdmin) {
      // O admin global tem permissão para ignorar o bloqueio de falta de setor para poder configurar o sistema inicial
    } else {
      next("/setor-selection");
      return;
    }
  }

  // Se não está autenticado e tenta fazer logout (limpar cookies)
  if (!isAuthenticated && hasSector) {
    setorCookie.clearSector();
  }

  // ✅ Carregar detalhes do setor se necessário
  if (to.meta.requiresSector && hasSector && isAuthenticated) {
    try {
      const setorId = setorCookie.getSectorId();
      const setorNome = setorCookie.getSectorName();

      // Restaurar estado do setor a partir dos cookies
      if (setorId && setorNome) {
        store.commit("setSetorAtual", {
          id: setorId,
          nome: setorNome,
        });
      }

      // Só carrega detalhes se não tem ou se é um setor diferente
      if (
        setorId &&
        (!store.state.setorDetails || store.state.setorDetails.id != setorId)
      ) {
        // Usar a função getSetorDetail que carrega setor + fornecedores relacionados
        const result = await functionsSetor.getSetorDetail(
          { $axios: axios, $store: store },
          setorId,
        );

        if (result.success) {
          // Já foi armazenado no Vuex pela função getSetorDetail
        } else {
          console.warn(
            "Aviso: não foi possível carregar detalhes do setor:",
            result.message,
          );
        }
      }
    } catch (error) {
      console.warn("Aviso: não foi possível carregar detalhes do setor");
    }
  }

  // Bloquear acesso a rotas de gerenciamento para solicitantes e almoxarifes
  if (isAuthenticated && hasSector) {
    // Define se o usuário logado é o administrador global do sistema
    const userObj = store.state.user || JSON.parse(localStorage.getItem('user') || '{}');
    const isGlobalAdmin = userObj && (
      userObj.email === "admin@admin.com" || userObj.email === "adminti@gmail.com" || userObj.is_super_admin || 
      !!userObj.is_admin || 
      !!userObj.is_super_admin
    );

    const isSolic = await checkIsSolicitante();
    const isAlmox = await checkIsAlmoxarife();

    // ------------------------------------------------------------------
    // Guard 1: bloquear solicitante de rotas de gerenciamento
    // ------------------------------------------------------------------
    const allowedForSolicitante = [
      "/dashboard",
      "/home",
      "/setor-atual",
      "/pedidos",
      "/setor-selection",
      "/login",
      "/register",
    ];
    if (
      isSolic &&
      to.meta &&
      to.meta.requiresSector &&
      !allowedForSolicitante.includes(to.path)
    ) {
      next("/setor-atual");
      return;
    }

    // ------------------------------------------------------------------
    // Guard 1.1: bloquear almoxarife e solicitante de todas as rotas de cadastros
    // (Produtos, Fornecedores, Grupos de Produtos, Unidades de Medida,
    //  Polos, Setores, Usuários, Perfis, Setores Consumidores)
    // ------------------------------------------------------------------
    const rotasCadastros = [
      "/produtos",
      "/produtos/novo",
      "/entradas/nova",
      "/fornecedores",
      "/grupoProduto",
      "/unidadesMedida",
      "/polos",
      "/setores",
      "/users",
      "/perfis",
      "/setores-consumidores",
    ];

    const isCadastroPath =
      rotasCadastros.some((p) => to.path === p || to.path.startsWith(p + "/")) ||
      (to.path.startsWith("/setor/") &&
        to.path !== "/setor-atual" &&
        to.path !== "/setor-selection");

    if ((isSolic || isAlmox) && isCadastroPath && !isGlobalAdmin) {
      next("/dashboard");
      return;
    }

    // ------------------------------------------------------------------
    // Guard 1.5: verificar globalAdminOnly
    // ------------------------------------------------------------------
    if (to.meta && to.meta.globalAdminOnly && !isGlobalAdmin) {
      next("/setor-atual");
      return;
    }

    // ------------------------------------------------------------------
    // Guard 1.6: verificar allowAdminSetores (Admin CAF, Polo ou SuperAdmin)
    // ------------------------------------------------------------------
    if (to.meta && to.meta.allowAdminSetores && !isGlobalAdmin) {
      const user = store.state.user || {};
      const isAdminCaf = !!user.is_admin_caf;
      const isAdminPolo = !!user.is_admin_polo;
      
      if (!isAdminCaf && !isAdminPolo) {
        next("/setor-atual");
        return;
      }
    }

    // ------------------------------------------------------------------
    // Guard 1.7: verificar forbiddenForGlobalAdmin
    // ------------------------------------------------------------------
    if (to.meta && to.meta.forbiddenForGlobalAdmin && isGlobalAdmin) {
      next("/setor-atual");
      return;
    }

    // ------------------------------------------------------------------
    // Guard 1.8: verificar forbiddenForCAF
    // ------------------------------------------------------------------
    if (to.meta && to.meta.forbiddenForCAF) {
      const setorDetalhe = store.state.setorDetails || {};
      const nome = (setorDetalhe.nome || "").toUpperCase();
      const isCAF = nome.includes("CAF") || nome.includes("FARMÁCIA CENTRAL") || nome.includes("FARMACIA CENTRAL");
      if (isCAF) {
        next("/setor-atual");
        return;
      }
    }

    // ------------------------------------------------------------------
    // Guard 2: verificar perfil necessário para rotas com meta.roles
    // ------------------------------------------------------------------
    if (to.meta && to.meta.roles && to.meta.roles.length > 0) {
      try {
        let list = store.state.listUsuariosSetor || [];

        // Se a lista não foi carregada ainda, tentar buscar
        if (
          (!list || list.length === 0) &&
          functionsUsuarioSetor &&
          functionsUsuarioSetor.listAll
        ) {
          try {
            await functionsUsuarioSetor.listAll({ $axios: axios, $store: store });
            list = store.state.listUsuariosSetor || [];
          } catch (e) {
            console.warn("Guard roles: erro ao carregar usuarios do setor", e);
          }
        }

        const user = store.state.user;
        const perfilDoUsuario = list.find((u) => {
          const userId =
            u.usuario_id || u.user_id || u.id || (u.usuario && u.usuario.id);
          return userId === (user && user.id);
        });

        const perfilAtual = (
          (perfilDoUsuario && (perfilDoUsuario.perfil || (perfilDoUsuario.pivot && perfilDoUsuario.pivot.perfil))) ||
          (user && user.perfil) ||
          ""
        )
          .toString()
          .toLowerCase();

        if (!to.meta.roles.includes(perfilAtual) && !isGlobalAdmin) {
          next("/setor-atual");
          return;
        }
      } catch (e) {
        console.warn("Guard roles: erro ao verificar perfil", e);
        next("/setor-atual");
        return;
      }
    }
  }

  next();
});

export default router;
