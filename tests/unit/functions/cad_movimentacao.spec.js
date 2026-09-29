import { describe, it, expect, vi, beforeEach } from "vitest";
import cadMovimentacao from "@/functions/cad_movimentacao.js";

describe("cad_movimentacao.js - Funções de Comunicação e Regras Frontend", () => {
  let mockContent;
  let mockAxios;
  let mockStore;
  let mockToastr;

  beforeEach(() => {
    vi.clearAllMocks();

    mockAxios = {
      get: vi.fn(),
      post: vi.fn(),
    };

    mockStore = {
      state: {
        user: { id: 42, name: "Usuário Mock" },
        auth: {
          user: { id: 42, name: "Usuário Mock" },
        },
      },
      getters: {
        getUserToken: "token-jwt-12345",
        "auth/getUserToken": "token-jwt-12345",
      },
      commit: vi.fn(),
    };

    mockToastr = {
      s: vi.fn(),
      e: vi.fn(),
    };

    mockContent = {
      $axios: mockAxios,
      $store: mockStore,
      $toastr: mockToastr,
    };
  });

  describe("devolverPedido", () => {
    it("envia payload de devolução corretamente e notifica sucesso", async () => {
      const payload = {
        motivo: "Devolução de teste",
        itens: [{ item_movimentacao_id: 1, quantidade_devolvendo: 5 }],
      };

      mockAxios.post.mockResolvedValueOnce({
        data: {
          status: true,
          message: "Devolução registrada com sucesso!",
        },
      });

      const result = await cadMovimentacao.devolverPedido(mockContent, 100, payload);

      expect(mockAxios.post).toHaveBeenCalledWith(
        "/movimentacao/100/devolver",
        payload,
        {
          headers: {
            Authorization: "Bearer token-jwt-12345",
            "Content-Type": "application/json",
          },
        }
      );

      expect(mockToastr.s).toHaveBeenCalledWith("Devolução registrada com sucesso!");
      expect(result.status).toBe(true);
    });

    it("trata erro de validação 422 e propaga detalhes dos campos", async () => {
      const payload = {
        motivo: "",
        itens: [{ item_movimentacao_id: 1, quantidade_devolvendo: 0 }],
      };

      mockAxios.post.mockRejectedValueOnce({
        response: {
          status: 422,
          data: {
            status: false,
            message: "Erros de validação",
            erros: {
              quantidade: ["A quantidade deve ser maior que zero."],
            },
          },
        },
      });

      await expect(
        cadMovimentacao.devolverPedido(mockContent, 100, payload)
      ).rejects.toEqual({
        validation: true,
        message: "Erros de validação",
        errors: {
          quantidade: ["A quantidade deve ser maior que zero."],
        },
      });
    });
  });

  describe("listBySetor", () => {
    it("faz requisição POST com parâmetros de setor e atualiza store", async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: {
          status: true,
          data: [
            { id: 1, tipo: "S", status_solicitacao: "P" },
            { id: 2, tipo: "D", status_solicitacao: "A" },
          ],
        },
      });

      await cadMovimentacao.listBySetor(mockContent, 5);

      expect(mockAxios.post).toHaveBeenCalledWith(
        "/movimentacao/listByUnidade",
        expect.objectContaining({
          setor_id: 5,
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer token-jwt-12345",
          }),
        })
      );

      expect(mockStore.commit).toHaveBeenCalledWith(
        "estoque/setListMovimentacoes",
        expect.arrayContaining([
          expect.objectContaining({ id: 1 }),
          expect.objectContaining({ id: 2 }),
        ])
      );
    });
  });

  describe("ADD_UP", () => {
    it("monta payload de cadastro normalizando itens e envia POST", async () => {
      mockAxios.post.mockResolvedValueOnce({
        data: {
          status: true,
          data: { id: 50 },
        },
      });

      const form = {
        setor_origem_id: 1,
        setor_destino_id: 2,
        tipo: "S",
        itens: [
          { produto_id: 10, quantidade: 4 },
        ],
      };

      const ctx = {
        ...mockContent,
        form,
      };

      await cadMovimentacao.ADD_UP(ctx, "ADD");

      expect(mockAxios.post).toHaveBeenCalledWith(
        "/movimentacao/add",
        expect.objectContaining({
          usuario_id: 42,
          setor_origem_id: 1,
          setor_destino_id: 2,
          tipo: "S",
          itens: [
            expect.objectContaining({
              produto_id: 10,
              quantidade_solicitada: 4,
            }),
          ],
        }),
        expect.anything()
      );
    });
  });
});
