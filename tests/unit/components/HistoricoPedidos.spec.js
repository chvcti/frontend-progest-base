import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import HistoricoPedidos from "@/components/roleSolicitante/HistoricoPedidos.vue";
import { createStore } from "vuex";
import axios from "axios";

vi.mock("axios");

const mockToast = vi.fn();
vi.mock("@/components/ui/toast/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useRoute: () => ({
    query: {},
  }),
}));

const globalStubs = {
  Card: { template: "<div class='card'><slot /></div>" },
  CardContent: { template: "<div class='card-content'><slot /></div>" },
  CardHeader: { template: "<div class='card-header'><slot /></div>" },
  CardTitle: { template: "<h3><slot /></h3>" },
  Button: {
    props: ["disabled"],
    template: "<button :disabled='disabled' @click='$emit(\"click\", $event)'><slot /></button>",
  },
  Badge: { template: "<span class='badge'><slot /></span>" },
  LoadingSpinner: { template: "<span class='spinner' />" },
  AlertDialog: {
    props: ["open"],
    template: "<div v-if='open' class='alert-dialog'><slot /></div>",
  },
  AlertDialogContent: { template: "<div><slot /></div>" },
  AlertDialogHeader: { template: "<div><slot /></div>" },
  AlertDialogTitle: { template: "<h4><slot /></h4>" },
  AlertDialogDescription: { template: "<p><slot /></p>" },
  AlertDialogFooter: { template: "<div><slot /></div>" },
  AlertDialogAction: {
    template: "<button class='alert-action' @click='$emit(\"click\", $event)'><slot /></button>",
  },
  AlertDialogCancel: { template: "<button class='alert-cancel'><slot /></button>" },
  ModalDevolucaoPedido: { template: "<div data-testid='modal-devolucao' />" },
  Input: { template: "<input />" },
};

describe("HistoricoPedidos.vue", () => {
  let store;

  beforeEach(() => {
    vi.clearAllMocks();

    store = createStore({
      modules: {
        auth: {
          namespaced: true,
          state: {
            user: { id: 10, name: "Solicitante Teste" },
            userToken: "token-123",
          },
          getters: {
            getUserToken: () => "token-123",
          },
        },
        estoque: {
          namespaced: true,
          state: {
            setorAtualId: 5,
            setorDetails: { id: 5, nome: "Enfermaria" },
          },
        },
      },
    });

    localStorage.setItem("token", "token-123");
  });

  it("carrega a lista de pedidos e exibe ações para rascunho", async () => {
    axios.post.mockImplementation((url) => {
      if (url.includes("/movimentacao/listBySetor")) {
        return Promise.resolve({
          data: {
            status: true,
            data: [
              {
                id: 201,
                tipo: "S",
                status_solicitacao: "C", // Rascunho
                setor_destino_id: 5,
                usuario_id: 10,
                itens: [],
              },
            ],
          },
        });
      }
      if (url.includes("/process")) {
        return Promise.resolve({
          data: { status: true, message: "Enviado com sucesso" },
        });
      }
      return Promise.resolve({ data: { status: true, data: [] } });
    });

    const wrapper = mount(HistoricoPedidos, {
      global: {
        plugins: [store],
        stubs: globalStubs,
      },
    });

    await flushPromises();

    expect(axios.post).toHaveBeenCalledWith(
      "/movimentacao/listBySetor",
      expect.objectContaining({ setor_id: 5 }),
      expect.anything()
    );

    const btnEnviar = wrapper.findAll("button").find((b) => b.text().includes("Enviar"));
    expect(btnEnviar).toBeDefined();

    await btnEnviar.trigger("click");
    await flushPromises();

    expect(axios.post).toHaveBeenCalledWith(
      "/movimentacao/201/process",
      { action: "submit", status: "P" },
      expect.anything()
    );
  });

  it("exclui rascunho através do dialog de confirmação", async () => {
    axios.post.mockImplementation((url) => {
      if (url.includes("/movimentacao/listBySetor")) {
        return Promise.resolve({
          data: {
            status: true,
            data: [
              {
                id: 202,
                tipo: "S",
                status_solicitacao: "C",
                setor_destino_id: 5,
                usuario_id: 10,
                itens: [],
              },
            ],
          },
        });
      }
      if (url.includes("/delete")) {
        return Promise.resolve({
          data: { status: true, message: "Rascunho excluído" },
        });
      }
      return Promise.resolve({ data: { status: true, data: [] } });
    });

    const wrapper = mount(HistoricoPedidos, {
      global: {
        plugins: [store],
        stubs: globalStubs,
      },
    });

    await flushPromises();

    wrapper.vm.abrirExcluirRascunho({ id: 202 });
    expect(wrapper.vm.showDeleteDialog).toBe(true);
    expect(wrapper.vm.pedidoSelecionado.id).toBe(202);

    await wrapper.vm.confirmarExclusaoRascunho();
    await flushPromises();

    expect(axios.post).toHaveBeenCalledWith(
      "/movimentacao/202/delete",
      {},
      expect.anything()
    );
    expect(wrapper.vm.showDeleteDialog).toBe(false);
  });

  it("cancela pedido pendente através do dialog de confirmação", async () => {
    axios.post.mockImplementation((url) => {
      if (url.includes("/movimentacao/listBySetor")) {
        return Promise.resolve({
          data: {
            status: true,
            data: [
              {
                id: 203,
                tipo: "S",
                status_solicitacao: "P", // Pendente
                setor_destino_id: 5,
                usuario_id: 10,
                itens: [],
              },
            ],
          },
        });
      }
      if (url.includes("/process")) {
        return Promise.resolve({
          data: { status: true, message: "Cancelado" },
        });
      }
      return Promise.resolve({ data: { status: true, data: [] } });
    });

    const wrapper = mount(HistoricoPedidos, {
      global: {
        plugins: [store],
        stubs: globalStubs,
      },
    });

    await flushPromises();

    wrapper.vm.abrirCancelarPedido({ id: 203 });
    expect(wrapper.vm.showCancelDialog).toBe(true);
    expect(wrapper.vm.pedidoSelecionado.id).toBe(203);

    await wrapper.vm.confirmarCancelamento();
    await flushPromises();

    expect(axios.post).toHaveBeenCalledWith(
      "/movimentacao/203/process",
      { action: "cancel", status: "X" },
      expect.anything()
    );
    expect(wrapper.vm.showCancelDialog).toBe(false);
  });
});
