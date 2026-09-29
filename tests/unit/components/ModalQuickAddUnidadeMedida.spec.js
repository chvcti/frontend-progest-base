import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import ModalQuickAddUnidadeMedida from "@/components/shared/ModalQuickAddUnidadeMedida.vue";
import { createStore } from "vuex";

describe("ModalQuickAddUnidadeMedida.vue", () => {
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
    const wrapper = mount(ModalQuickAddUnidadeMedida, {
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

  it("salva unidade de medida com sucesso e emite evento created", async () => {
    mockAxios.post.mockResolvedValueOnce({
      data: {
        status: true,
        data: { id: 7, nome: "AMPOLA", quantidade_unidade_minima: 1 },
      },
    });

    const wrapper = mount(ModalQuickAddUnidadeMedida, {
      global: {
        plugins: [store],
        mocks: {
          $axios: mockAxios,
        },
      },
    });

    wrapper.vm.form.nome = "AMPOLA";
    wrapper.vm.form.quantidade_unidade_minima = 1;

    await wrapper.vm.salvar();
    await flushPromises();

    expect(mockAxios.post).toHaveBeenCalledWith(
      "/unidadeMedida/add",
      expect.objectContaining({
        unidadeMedida: expect.objectContaining({
          nome: "AMPOLA",
          quantidade_unidade_minima: 1,
          status: "A",
        }),
      }),
      expect.anything()
    );

    expect(wrapper.emitted("created")).toBeDefined();
    expect(wrapper.emitted("created")[0][0]).toEqual({
      id: 7,
      nome: "AMPOLA",
      quantidade_unidade_minima: 1,
    });
  });
});
