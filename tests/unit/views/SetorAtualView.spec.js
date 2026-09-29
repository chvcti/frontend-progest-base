import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createStore } from "vuex";
import SetorAtualView from "@/views/SetorAtualView.vue";
import TabEstoque from "@/components/setorAtual/TabEstoque.vue";
import { usePerfil } from "@/composables/usePerfil";
import functionsSetor from "@/functions/cad_setores";
import functionsEstoque from "@/functions/cad_estoque";
import functionsMovimentacao from "@/functions/cad_movimentacao";
import functionsEntrada from "@/functions/cad_entradas";
import functionsUsuarioSetor from "@/functions/cad_usuario_setor";

// Mock das rotas vue-router
const mockRoute = { query: {} };
const mockRouter = { replace: vi.fn() };

vi.mock("vue-router", () => ({
  useRoute: () => mockRoute,
  useRouter: () => mockRouter,
}));

// Mock do setorCookie
vi.mock("@/utils/setorCookie", () => ({
  setorCookie: {
    getSectorId: () => 1,
    setSectorId: vi.fn(),
  },
}));

// Helper para criar store mockada
function createMockStore(user, setorDetails, listUsuariosSetor = []) {
  return createStore({
    modules: {
      auth: {
        namespaced: true,
        state: () => ({
          user: user || null,
        }),
        getters: {
          getUserToken: () => "mock-token",
          isSuperAdmin: (state) => {
            const u = state.user;
            if (!u) return false;
            return (
              u.email === "adminti@gmail.com" ||
              u.email === "admin@admin.com" ||
              !!u.is_super_admin
            );
          },
        },
      },
      estoque: {
        namespaced: true,
        state: () => ({
          setorAtualId: setorDetails?.id || 1,
          setorAtualNome: setorDetails?.nome || null,
          setorDetails: setorDetails || null,
          listUsuariosSetor: listUsuariosSetor,
          listEstoque: [],
        }),
        mutations: {
          setSetorDetails(state, val) {
            state.setorDetails = val;
          },
          setListUsuariosSetor(state, val) {
            state.listUsuariosSetor = val;
          },
        },
      },
    },
    state: {
      user: user || null,
      setorAtualId: setorDetails?.id || 1,
      setorDetails: setorDetails || null,
      listUsuariosSetor: listUsuariosSetor,
      listEstoque: [],
      modalData: { isModalOpen: false, modalFunction: "ADD" },
    },
    getters: {
      getUserToken: () => "mock-token",
      isSuperAdmin: (state) => {
        const u = state.auth?.user || state.user;
        if (!u) return false;
        return (
          u.email === "adminti@gmail.com" ||
          u.email === "admin@admin.com" ||
          !!u.is_super_admin
        );
      },
    },
    mutations: {
      setSetorDetails(state, val) {
        state.setorDetails = val;
      },
      setListUsuariosSetor(state, val) {
        state.listUsuariosSetor = val;
      },
      setPageHeader() {},
      clearPageHeader() {},
      setModalData() {},
      setModalFunction() {},
      setModalOpen() {},
    },
  });
}

// Stubs comuns para componentes visuais secundários
const globalStubs = {
  TemplateAdmin: { template: "<div><slot /></div>" },
  TabOverview: { template: "<div data-testid='tab-overview' />" },
  TabMovimentacoes: { template: "<div data-testid='tab-movimentacoes' />" },
  TabEntrada: { template: "<div data-testid='tab-entrada' />" },
  TabUsuarios: { template: "<div data-testid='tab-usuarios' />" },
  ModalSetor: { template: "<div />" },
  LoadingSpinner: { template: "<div />" },
  Button: { template: "<button><slot /></button>" },
  Tabs: { template: "<div><slot /></div>" },
  TabsList: { template: "<div><slot /></div>" },
  TabsContent: {
    props: ["value"],
    template: "<div><slot /></div>",
  },
  TabsTrigger: {
    props: ["value"],
    template: '<button :value="value" :data-tab="value"><slot /></button>',
  },
};

describe("SetorAtualView.vue & TabEstoque.vue - Regras Operacionais e Permissões", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRoute.query = {};

    // Mock padrão dos serviços
    vi.spyOn(functionsEstoque, "listAll").mockResolvedValue({ success: true, data: [] });
    vi.spyOn(functionsMovimentacao, "listAll").mockResolvedValue({ success: true, data: [] });
    vi.spyOn(functionsEntrada, "listAll").mockResolvedValue({ success: true, data: [] });
    vi.spyOn(functionsUsuarioSetor, "listAll").mockImplementation(async (ctx) => {
      const list = ctx?.$store?.state?.estoque?.listUsuariosSetor || ctx?.$store?.state?.listUsuariosSetor || [];
      if (ctx && ctx.usuariosItems) {
        ctx.usuariosItems.value = list;
      }
      return { success: true, data: list };
    });
  });

  // =========================================================================
  // 1. ISOLAMENTO DE PERFIL SOLICITANTE
  // =========================================================================
  describe("1. Isolamento de Perfil Solicitante", () => {
    const userSolicitante = { id: 10, name: "Jean Solicitante", email: "jeansolicitante@gmail.com" };
    const setorComEstoque = { id: 1, nome: "CENTRAL DE ABASTECIMENTO FARMACÊUTICO (CAF)", estoque: true };
    const usuariosSetor = [{ usuario_id: 10, perfil: "solicitante" }];

    it("não deve renderizar abas de ação restrita (movimentacoes, entrada, equipe) para o solicitante", async () => {
      vi.spyOn(functionsSetor, "buscarSetorPorId").mockResolvedValue({
        success: true,
        data: setorComEstoque,
      });

      const store = createMockStore(userSolicitante, setorComEstoque, usuariosSetor);

      const wrapper = mount(SetorAtualView, {
        global: {
          plugins: [store],
          stubs: globalStubs,
        },
      });

      // Aguarda carregamento inicial
      await flushPromises();

      // Aba de Estoque é visível
      const tabEstoque = wrapper.find('[data-tab="estoque"]');
      expect(tabEstoque.exists()).toBe(true);

      // Abas restritas NÃO devem existir para solicitante
      const tabMovimentacoes = wrapper.find('[data-tab="movimentacoes"]');
      expect(tabMovimentacoes.exists()).toBe(false);

      const tabEntrada = wrapper.find('[data-tab="entrada"]');
      expect(tabEntrada.exists()).toBe(false);

      const tabUsuarios = wrapper.find('[data-tab="usuarios"]');
      expect(tabUsuarios.exists()).toBe(false);
    });

    it("deve passar readOnly: true para TabEstoque quando o usuário for solicitante", async () => {
      vi.spyOn(functionsSetor, "buscarSetorPorId").mockResolvedValue({
        success: true,
        data: setorComEstoque,
      });

      const store = createMockStore(userSolicitante, setorComEstoque, usuariosSetor);

      const wrapper = mount(SetorAtualView, {
        global: {
          plugins: [store],
          stubs: globalStubs,
        },
      });

      await flushPromises();

      const compEstoque = wrapper.findComponent(TabEstoque);
      expect(compEstoque.exists()).toBe(true);
      expect(compEstoque.props("readOnly")).toBe(true);
    });

    it("TabEstoque com readOnly: true oculta botões de edição de estoque e ações restritas", async () => {
      const store = createMockStore(userSolicitante, setorComEstoque, usuariosSetor);

      const mockItems = [
        {
          estoque_id: 1,
          quantidade_atual: 50,
          quantidade_minima: 10,
          status_disponibilidade: "D",
          abaixo_minimo: false,
          valor_total: null,
          preco_medio: null,
          produto: {
            id: 101,
            nome: "Dipirona 500mg",
            grupo_produto: { nome: "Medicamentos" },
            unidade_medida: { nome: "AMP" },
          },
        },
      ];

      const wrapper = mount(TabEstoque, {
        props: { readOnly: true },
        global: {
          plugins: [store],
          provide: {
            setorAtualData: {
              estoqueItems: mockItems,
              resumoEstoque: { total_produtos: 1, pode_ver_valores: false, valor_total_patrimonio: null },
              setorEstoque: setorComEstoque,
            },
          },
        },
      });

      await wrapper.vm.$nextTick();

      // Botão de editar quantidade mínima (PencilIcon / ação de alteração) NÃO deve existir
      const botoesEdicao = wrapper.findAll("button[class*='text-slate-400']");
      const temBotaoEditar = botoesEdicao.some((btn) => btn.html().includes("lucide-pencil"));
      expect(temBotaoEditar).toBe(false);

      // Card de patrimônio financeiro não deve ser renderizado para solicitante
      expect(wrapper.text()).not.toContain("Patrimônio em Estoque");
    });
  });

  // =========================================================================
  // 2. SETOR SEM ESTOQUE FÍSICO (estoque: false)
  // =========================================================================
  describe("2. Setor sem Estoque Físico (estoque: false)", () => {
    const userAdmin = { id: 1, name: "Admin Geral", email: "adminti@gmail.com" };
    const setorSemEstoque = { id: 3, nome: "CLÍNICA MÉDICA", estoque: false };

    it("não deve renderizar a aba de Estoque se o setor tiver estoque: false", async () => {
      vi.spyOn(functionsSetor, "buscarSetorPorId").mockResolvedValue({
        success: true,
        data: setorSemEstoque,
      });

      const store = createMockStore(userAdmin, setorSemEstoque);

      const wrapper = mount(SetorAtualView, {
        global: {
          plugins: [store],
          stubs: globalStubs,
        },
      });

      await flushPromises();

      // A aba de Estoque NÃO deve existir no menu de tabs
      const tabEstoque = wrapper.find('[data-tab="estoque"]');
      expect(tabEstoque.exists()).toBe(false);

      // Não deve chamar o serviço de listagem de estoque para setor sem estoque
      expect(functionsEstoque.listAll).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 3. ALMOXARIFE EM SETOR DISTRIBUIDOR (estoque: true)
  // =========================================================================
  describe("3. Almoxarife em Setor Distribuidor (estoque: true)", () => {
    const userAlmoxarife = { id: 2, name: "Arthur Almoxarife", email: "arthuralmoxarife@gmail.com" };

    it("renderiza abas completas (Estoque, Movimentações) e Entrada na CAF", async () => {
      const setorCAF = { id: 1, nome: "CENTRAL DE ABASTECIMENTO FARMACÊUTICO (CAF)", estoque: true };
      const usuariosSetor = [{ usuario_id: 2, perfil: "almoxarife" }];

      vi.spyOn(functionsSetor, "buscarSetorPorId").mockResolvedValue({
        success: true,
        data: setorCAF,
      });

      const store = createMockStore(userAlmoxarife, setorCAF, usuariosSetor);

      const wrapper = mount(SetorAtualView, {
        global: {
          plugins: [store],
          stubs: globalStubs,
        },
      });

      await flushPromises();

      // Estoque e Movimentações devem existir
      expect(wrapper.find('[data-tab="estoque"]').exists()).toBe(true);
      expect(wrapper.find('[data-tab="movimentacoes"]').exists()).toBe(true);

      // Por ser CAF, deve permitir acesso à aba de Entrada
      expect(wrapper.find('[data-tab="entrada"]').exists()).toBe(true);

      // TabEstoque recebe readOnly: false para almoxarife
      const compEstoque = wrapper.findComponent(TabEstoque);
      expect(compEstoque.props("readOnly")).toBe(false);
    });

    it("em farmácia satélite que NÃO é a CAF, não deve renderizar a aba de Entrada", async () => {
      const setorSatelite = { id: 2, nome: "FARMÁCIA DE DISPENSAÇÃO", estoque: true };
      const usuariosSetor = [{ usuario_id: 2, perfil: "almoxarife" }];

      vi.spyOn(functionsSetor, "buscarSetorPorId").mockResolvedValue({
        success: true,
        data: setorSatelite,
      });

      const store = createMockStore(userAlmoxarife, setorSatelite, usuariosSetor);

      const wrapper = mount(SetorAtualView, {
        global: {
          plugins: [store],
          stubs: globalStubs,
        },
      });

      await flushPromises();

      // Estoque e Movimentações continuam existindo
      expect(wrapper.find('[data-tab="estoque"]').exists()).toBe(true);
      expect(wrapper.find('[data-tab="movimentacoes"]').exists()).toBe(true);

      // Entrada é EXCLUSIVA da CAF, logo não deve existir na Farmácia de Dispensação
      expect(wrapper.find('[data-tab="entrada"]').exists()).toBe(false);
    });
  });

  // =========================================================================
  // 4. COMPOSABLE USEPERFIL - VALIDAÇÃO ISOLADA DE REGRAS
  // =========================================================================
  describe("4. Composable usePerfil", () => {
    it("identifica corretamente perfil solicitante e bloqueia permissão de relatórios", () => {
      const user = { id: 5, name: "Solicitante Teste" };
      const store = createMockStore(user, null, [{ usuario_id: 5, perfil: "solicitante" }]);

      // Monta um componente wrapper mínimo para usar o composable com a store
      const wrapper = mount({
        template: "<div />",
        setup() {
          return usePerfil();
        },
      }, {
        global: { plugins: [store] },
      });

      expect(wrapper.vm.isSolicitante).toBe(true);
      expect(wrapper.vm.isAdmin).toBe(false);
      expect(wrapper.vm.isAlmoxarife).toBe(false);
      expect(wrapper.vm.podeVerRelatorios).toBe(false);
    });

    it("identifica almoxarife e libera permissão de relatórios", () => {
      const user = { id: 6, name: "Almoxarife Teste" };
      const store = createMockStore(user, null, [{ usuario_id: 6, perfil: "almoxarife" }]);

      const wrapper = mount({
        template: "<div />",
        setup() {
          return usePerfil();
        },
      }, {
        global: { plugins: [store] },
      });

      expect(wrapper.vm.isAlmoxarife).toBe(true);
      expect(wrapper.vm.isAdmin).toBe(false);
      expect(wrapper.vm.isSolicitante).toBe(false);
      expect(wrapper.vm.podeVerRelatorios).toBe(true);
    });

    it("Super Admin possui bypass global (God Mode) e nunca é tratado como solicitante", () => {
      const user = { id: 1, email: "adminti@gmail.com" };
      const store = createMockStore(user, null, []);

      const wrapper = mount({
        template: "<div />",
        setup() {
          return usePerfil();
        },
      }, {
        global: { plugins: [store] },
      });

      expect(wrapper.vm.isAdmin).toBe(true);
      expect(wrapper.vm.isAlmoxarife).toBe(true);
      expect(wrapper.vm.isSolicitante).toBe(false);
      expect(wrapper.vm.podeVerRelatorios).toBe(true);
    });
  });
});
