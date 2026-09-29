import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createStore } from "vuex";
import Home from "@/views/Home.vue";
import * as dashboardService from "@/functions/dashboard";

const mockRouter = { push: vi.fn() };

vi.mock("vue-router", () => ({
  useRouter: () => mockRouter,
}));

vi.mock("@/functions/dashboard", () => ({
  getDashboardMetrics: vi.fn(),
}));

vi.mock("@/functions/cad_usuario_setor", () => ({
  default: {
    listAll: vi.fn().mockResolvedValue([]),
  },
}));

// Stub para TemplateAdmin e componentes UI
const globalStubs = {
  TemplateAdmin: { template: "<div><slot /></div>" },
  LoadingSpinner: { template: "<span class='spinner'>Loading</span>" },
};

function createMockStore(setorDetails, isSuperAdmin = false) {
  return createStore({
    state: () => ({
      pageHeader: null,
    }),
    mutations: {
      setPageHeader(state, payload) {
        state.pageHeader = payload;
      },
    },
    modules: {
      auth: {
        namespaced: true,
        state: () => ({
          user: { id: 10, name: "Usuário Teste", email: "user@teste.com" },
        }),
        getters: {
          getUserToken: () => "mock-token",
          isSuperAdmin: () => isSuperAdmin,
        },
      },
      estoque: {
        namespaced: true,
        state: () => ({
          setorAtualId: setorDetails?.id || 1,
          setorDetails: setorDetails || { id: 1, nome: "Setor Farmácia", estoque: true },
          listUsuariosSetor: [],
        }),
      },
    },
  });
}

describe("Home.vue - Dashboard Integrado", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("carrega indicadores do dashboard e renderiza cards para setor com estoque", async () => {
    dashboardService.getDashboardMetrics.mockResolvedValueOnce({
      status: true,
      data: {
        stats: {
          totalItens: 42,
          abaixoMinimo: 5,
          pendentesEntrada: 3,
          pendentesSaida: 1,
          pedidosEntreguesMes: 0,
          itensSolicitadosMes: 0,
        },
        alerts: [
          {
            id: 1,
            quantidade_atual: 2,
            quantidade_minima: 10,
            produto: { nome: "Dipirona 500mg", unidade_medida: { sigla: "COMP" } },
          },
        ],
        recentRequests: [],
      },
    });

    const store = createMockStore({ id: 1, nome: "Farmácia Central", estoque: true });

    const wrapper = mount(Home, {
      global: {
        plugins: [store],
        stubs: globalStubs,
      },
    });

    await flushPromises();

    expect(dashboardService.getDashboardMetrics).toHaveBeenCalledWith({ setorId: 1 });
    expect(wrapper.text()).toContain("42");
    expect(wrapper.text()).toContain("5");
    expect(wrapper.text()).toContain("Dipirona 500mg");
  });

  it("renderiza métricas específicas para setor consumidor (sem estoque)", async () => {
    dashboardService.getDashboardMetrics.mockResolvedValueOnce({
      status: true,
      data: {
        stats: {
          totalItens: 0,
          abaixoMinimo: 0,
          pendentesEntrada: 4,
          pendentesSaida: 0,
          pedidosEntreguesMes: 12,
          itensSolicitadosMes: 85,
        },
        alerts: [],
        recentRequests: [],
      },
    });

    const store = createMockStore({ id: 2, nome: "UBS Consumidor", estoque: false });

    const wrapper = mount(Home, {
      global: {
        plugins: [store],
        stubs: globalStubs,
      },
    });

    await flushPromises();

    expect(dashboardService.getDashboardMetrics).toHaveBeenCalledWith({ setorId: 2 });
    expect(wrapper.text()).toContain("12");
    expect(wrapper.text()).toContain("85");
    expect(wrapper.text()).toContain("Pedidos Entregues (Mês)");
  });
});
