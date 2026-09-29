import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import ModalQuickAddProduto from "@/components/shared/ModalQuickAddProduto.vue";
import { createStore } from "vuex";

describe("ModalQuickAddProduto.vue", () => {
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

  it("salva produto com sucesso e emite evento created", async () => {
    mockAxios.post.mockResolvedValueOnce({
      data: {
        status: true,
        data: { id: 55, nome: "AMOXICILINA 500MG" },
      },
    });

    const wrapper = mount(ModalQuickAddProduto, {
      props: {
        gruposDisponiveis: [{ id: 1, nome: "Antibióticos" }],
        unidadesDisponiveis: [{ id: 2, nome: "Frasco" }],
      },
      global: {
        plugins: [store],
        mocks: {
          $axios: mockAxios,
        },
      },
    });

    wrapper.vm.form.nome = "AMOXICILINA 500MG";
    wrapper.vm.form.unidade_medida_id = "2";
    wrapper.vm.form.grupo_produto_id = "1";

    await wrapper.vm.salvar();
    await flushPromises();

    expect(mockAxios.post).toHaveBeenCalledWith(
      "/produtos/add",
      expect.objectContaining({
        produto: expect.objectContaining({
          nome: "AMOXICILINA 500MG",
          unidade_medida_id: "2",
        }),
      }),
      expect.anything()
    );

    expect(wrapper.emitted("created")).toBeDefined();
    expect(wrapper.emitted("created")[0][0]).toEqual({
      id: 55,
      nome: "AMOXICILINA 500MG",
    });
  });
});
