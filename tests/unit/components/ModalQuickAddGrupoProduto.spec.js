import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import ModalQuickAddGrupoProduto from "@/components/shared/ModalQuickAddGrupoProduto.vue";
import { createStore } from "vuex";

describe("ModalQuickAddGrupoProduto.vue", () => {
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
    const wrapper = mount(ModalQuickAddGrupoProduto, {
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

  it("salva grupo de produto com sucesso e emite evento created", async () => {
    mockAxios.post.mockResolvedValueOnce({
      data: {
        status: true,
        data: { id: 12, nome: "ANALGÉSICOS", tipo: "Medicamento" },
      },
    });

    const wrapper = mount(ModalQuickAddGrupoProduto, {
      global: {
        plugins: [store],
        mocks: {
          $axios: mockAxios,
        },
      },
    });

    wrapper.vm.form.nome = "ANALGÉSICOS";
    wrapper.vm.form.tipo = "Medicamento";

    await wrapper.vm.salvar();
    await flushPromises();

    expect(mockAxios.post).toHaveBeenCalledWith(
      "/grupoProduto/add",
      expect.objectContaining({
        grupoProduto: expect.objectContaining({
          nome: "ANALGÉSICOS",
          tipo: "Medicamento",
          status: "A",
        }),
      }),
      expect.anything()
    );

    expect(wrapper.emitted("created")).toBeDefined();
    expect(wrapper.emitted("created")[0][0]).toEqual({
      id: 12,
      nome: "ANALGÉSICOS",
      tipo: "Medicamento",
    });
  });
});
