import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createStore } from "vuex";
import ModalDevolucaoPedido from "@/components/roleSolicitante/ModalDevolucaoPedido.vue";
import cadMovimentacao from "@/functions/cad_movimentacao.js";

// Mock do hook de toast
const mockToast = vi.fn();
vi.mock("@/components/ui/toast/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock dos componentes de UI
const globalStubs = {
  Dialog: {
    props: ["open"],
    template: "<div v-if='open' data-testid='dialog'><slot /></div>",
  },
  DialogContent: { template: "<div data-testid='dialog-content'><slot /></div>" },
  DialogHeader: { template: "<div><slot /></div>" },
  DialogTitle: { template: "<h2><slot /></h2>" },
  DialogDescription: { template: "<p><slot /></p>" },
  DialogFooter: { template: "<footer><slot /></footer>" },
  Button: {
    props: ["disabled", "variant"],
    template: "<button :disabled='disabled'><slot /></button>",
  },
  Input: {
    props: ["modelValue", "type", "max", "min"],
    template: "<input :type='type' :value='modelValue' @input=\"$emit('update:modelValue', $event.target.value)\" />",
  },
  Textarea: {
    props: ["modelValue"],
    template: "<textarea :value='modelValue' @input=\"$emit('update:modelValue', $event.target.value)\" />",
  },
};

describe("ModalDevolucaoPedido.vue - Validações e Fluxo de Devolução", () => {
  let store;

  beforeEach(() => {
    vi.clearAllMocks();
    store = createStore({
      modules: {
        auth: {
          namespaced: true,
          state: () => ({
            user: { id: 10, name: "Solicitante Teste" },
          }),
          getters: {
            getUserToken: () => "mock-jwt-token",
          },
        },
      },
      state: {
        user: { id: 10, name: "Solicitante Teste" },
      },
      getters: {
        getUserToken: () => "mock-jwt-token",
      },
    });
  });

  const mockMovimentacao = {
    id: 999,
    itens: [
      {
        id: 101,
        produto: { nome: "Amoxicilina 500mg" },
        lote: JSON.stringify([{ lote: "LOT-AMOX-01", quantidade: 20 }]),
        quantidade_liberada: 20,
      },
      {
        id: 102,
        produto: { nome: "Ibuprofeno 400mg" },
        lote: JSON.stringify([{ lote: "LOT-IBU-02", quantidade: 10 }]),
        quantidade_liberada: 10,
      },
    ],
  };

  it("não renderiza o conteúdo do modal quando movimentacao é null", () => {
    const wrapper = mount(ModalDevolucaoPedido, {
      props: { movimentacao: null },
      global: {
        plugins: [store],
        stubs: globalStubs,
      },
    });

    expect(wrapper.find("[data-testid='dialog']").exists()).toBe(false);
  });

  it("abre o modal e lista os itens do pedido com quantidade devolvendo zerada", async () => {
    const wrapper = mount(ModalDevolucaoPedido, {
      props: { movimentacao: mockMovimentacao },
      global: {
        plugins: [store],
        stubs: globalStubs,
      },
    });

    await flushPromises();

    expect(wrapper.find("[data-testid='dialog']").exists()).toBe(true);
    const text = wrapper.text();
    expect(text).toContain("Devolução do Pedido #999");
    expect(text).toContain("Amoxicilina 500mg");
    expect(text).toContain("Ibuprofeno 400mg");
    expect(text).toContain("LOT-AMOX-01");
    expect(text).toContain("LOT-IBU-02");
  });

  it("bloqueia o envio se todos os itens estiverem com quantidade 0 (erroZero)", async () => {
    const wrapper = mount(ModalDevolucaoPedido, {
      props: { movimentacao: mockMovimentacao },
      global: {
        plugins: [store],
        stubs: globalStubs,
      },
    });

    await flushPromises();

    // Mensagem de aviso de que ao menos um item deve ser informado
    expect(wrapper.text()).toContain("Preencha a quantidade de pelo menos um item para devolução");

    // Botão de enviar solicitação deve estar desabilitado
    const submitBtn = wrapper.findAll("button").find(b => b.text().includes("Enviar Solicitação"));
    expect(submitBtn.attributes("disabled")).toBeDefined();
  });

  it("bloqueia o envio e exibe alerta se a quantidade exceder a liberada (erroExcede)", async () => {
    const wrapper = mount(ModalDevolucaoPedido, {
      props: { movimentacao: mockMovimentacao },
      global: {
        plugins: [store],
        stubs: globalStubs,
      },
    });

    await flushPromises();

    // Define uma quantidade maior que a permitida (25 > 20)
    const inputs = wrapper.findAll("input");
    await inputs[0].setValue(25);
    await flushPromises();

    expect(wrapper.text()).toContain("A quantidade a devolver não pode superar o saldo atendido disponível.");
    const submitBtn = wrapper.findAll("button").find(b => b.text().includes("Enviar Solicitação"));
    expect(submitBtn.attributes("disabled")).toBeDefined();
  });

  it("habilita o envio quando uma quantidade válida é informada e executa devolução com sucesso", async () => {
    const spyDevolver = vi.spyOn(cadMovimentacao, "devolverPedido").mockResolvedValue({
      status: true,
      message: "Devolução registrada com sucesso!",
    });

    const wrapper = mount(ModalDevolucaoPedido, {
      props: { movimentacao: mockMovimentacao },
      global: {
        plugins: [store],
        stubs: globalStubs,
      },
    });

    await flushPromises();

    // Informar quantidade válida no primeiro item (ex: 5)
    const inputs = wrapper.findAll("input");
    await inputs[0].setValue(5);

    // Informar motivo
    const textarea = wrapper.find("textarea");
    if (textarea.exists()) {
      await textarea.setValue("Devolução de sobra de plantão");
    }

    await flushPromises();

    // Botão de envio deve estar habilitado
    const submitBtn = wrapper.findAll("button").find(b => b.text().includes("Enviar Solicitação"));
    expect(submitBtn.attributes("disabled")).toBeUndefined();

    // Clica no botão de enviar
    await submitBtn.trigger("click");
    await flushPromises();

    // Verifica chamada ao serviço
    expect(spyDevolver).toHaveBeenCalledTimes(1);
    const [, movId, payload] = spyDevolver.mock.calls[0];
    expect(movId).toBe(999);
    expect(payload.motivo).toBe("Devolução de sobra de plantão");
    expect(payload.itens).toEqual([
      { item_movimentacao_id: 101, quantidade_devolvendo: 5 },
      { item_movimentacao_id: 102, quantidade_devolvendo: 0 },
    ]);

    // Verifica emissão dos eventos de sucesso e fechamento
    expect(wrapper.emitted("sucesso")).toBeTruthy();
    expect(wrapper.emitted("update:open")).toBeTruthy();
    expect(wrapper.emitted("update:open")[0]).toEqual([false]);
  });

  it("emite update:open false ao clicar em Cancelar", async () => {
    const wrapper = mount(ModalDevolucaoPedido, {
      props: { movimentacao: mockMovimentacao },
      global: {
        plugins: [store],
        stubs: globalStubs,
      },
    });

    await flushPromises();

    const cancelBtn = wrapper.findAll("button").find(b => b.text().includes("Cancelar"));
    await cancelBtn.trigger("click");

    expect(wrapper.emitted("update:open")).toBeTruthy();
    expect(wrapper.emitted("update:open")[0]).toEqual([false]);
  });
});
