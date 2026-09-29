import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import ModalQuickAddFornecedor from "@/components/shared/ModalQuickAddFornecedor.vue";
import { createStore } from "vuex";

describe("ModalQuickAddFornecedor.vue", () => {
  let mockAxios;
  let store;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAxios = {
      post: vi.fn(),
    };

    store = createStore({
      modules: {
        auth: {
          namespaced: true,
          getters: {
            getUserToken: () => "mock-token",
          },
        },
      },
    });
  });

  it("emite cancelamento quando clicar no botão cancelar", async () => {
    const wrapper = mount(ModalQuickAddFornecedor, {
      global: {
        plugins: [store],
        mocks: {
          $axios: mockAxios,
        },
      },
    });

    const btnCancelar = wrapper.findAll("button").find((b) => b.text().includes("Cancelar"));
    expect(btnCancelar).toBeDefined();
    await btnCancelar.trigger("click");

    expect(wrapper.emitted("cancel")).toHaveLength(1);
  });

  it("valida campos obrigatórios e salva fornecedor emitindo evento created", async () => {
    mockAxios.post.mockResolvedValueOnce({
      data: {
        status: true,
        data: { id: 99, razao_social_nome: "DISTRIBUIDORA TESTE LTDA" },
      },
    });

    const wrapper = mount(ModalQuickAddFornecedor, {
      global: {
        plugins: [store],
        mocks: {
          $axios: mockAxios,
        },
      },
    });

    // Preencher formulário
    wrapper.vm.form.nome = "DISTRIBUIDORA TESTE LTDA";
    wrapper.vm.form.tipo = "J";
    wrapper.vm.form.documento = "12.345.678/0001-90";

    await wrapper.vm.salvar();
    await flushPromises();

    expect(mockAxios.post).toHaveBeenCalledWith(
      "/fornecedores/add",
      expect.objectContaining({
        fornecedor: expect.objectContaining({
          razao_social_nome: "DISTRIBUIDORA TESTE LTDA",
          cnpj: "12345678000190",
        }),
      }),
      expect.anything()
    );

    expect(wrapper.emitted("created")).toBeDefined();
    expect(wrapper.emitted("created")[0][0]).toEqual({
      id: 99,
      razao_social_nome: "DISTRIBUIDORA TESTE LTDA",
    });
  });
});
