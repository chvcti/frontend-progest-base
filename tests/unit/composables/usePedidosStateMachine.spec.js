import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePedidosStateMachine } from "@/composables/usePedidosStateMachine";
import axios from "axios";

vi.mock("axios");

const mockToast = vi.fn();
vi.mock("@/components/ui/toast/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

describe("usePedidosStateMachine.js", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("enviarParaAnalise", () => {
    it("promove rascunho para análise com sucesso e invoca callback", async () => {
      const onSuccess = vi.fn();
      axios.post.mockResolvedValueOnce({
        data: { status: true, message: "Sucesso" },
      });

      const { enviarParaAnalise, actionInProgress, isLoadingAcao } =
        usePedidosStateMachine(onSuccess);

      expect(isLoadingAcao.value).toBe(false);

      const promise = enviarParaAnalise({ id: 101, status_solicitacao: "C" });
      expect(actionInProgress.value).toBe(101);
      expect(isLoadingAcao.value).toBe(true);

      const result = await promise;
      expect(result).toBe(true);
      expect(actionInProgress.value).toBeNull();
      expect(isLoadingAcao.value).toBe(false);

      expect(axios.post).toHaveBeenCalledWith(
        "/movimentacao/101/process",
        { action: "submit", status: "P" },
        expect.anything()
      );
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Sucesso",
          description: expect.stringContaining("#101"),
        })
      );
    });

    it("trata erro na promoção de rascunho", async () => {
      const onSuccess = vi.fn();
      axios.post.mockRejectedValueOnce({
        response: { data: { message: "Item sem saldo disponível" } },
      });

      const { enviarParaAnalise, erro, actionInProgress } =
        usePedidosStateMachine(onSuccess);

      const result = await enviarParaAnalise(102);
      expect(result).toBe(false);
      expect(actionInProgress.value).toBeNull();
      expect(erro.value).toBe("Item sem saldo disponível");
      expect(onSuccess).not.toHaveBeenCalled();
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Erro",
          description: "Item sem saldo disponível",
          variant: "destructive",
        })
      );
    });
  });

  describe("cancelarPedido", () => {
    it("cancela pedido pendente com sucesso", async () => {
      const onSuccess = vi.fn();
      axios.post.mockResolvedValueOnce({
        data: { status: true },
      });

      const { cancelarPedido } = usePedidosStateMachine(onSuccess);

      const result = await cancelarPedido(103, "Cancelado pelo usuário");
      expect(result).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        "/movimentacao/103/process",
        { action: "cancel", status: "X", justificativa: "Cancelado pelo usuário" },
        expect.anything()
      );
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Sucesso",
          description: "Pedido cancelado com sucesso.",
        })
      );
    });
  });

  describe("excluirRascunho", () => {
    it("exclui rascunho com sucesso", async () => {
      const onSuccess = vi.fn();
      axios.post.mockResolvedValueOnce({
        data: { status: true },
      });

      const { excluirRascunho } = usePedidosStateMachine(onSuccess);

      const result = await excluirRascunho({ id: 104 });
      expect(result).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        "/movimentacao/104/delete",
        {},
        expect.anything()
      );
      expect(onSuccess).toHaveBeenCalledTimes(1);
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Sucesso",
          description: "Rascunho excluído com sucesso.",
        })
      );
    });
  });

  describe("aprovarPedido e rejeitarPedido", () => {
    it("aprova pedido com itens liberados", async () => {
      const onSuccess = vi.fn();
      axios.post.mockResolvedValueOnce({ data: { status: true } });

      const { aprovarPedido } = usePedidosStateMachine(onSuccess);
      const itens = [{ id: 1, quantidade_liberada: 10 }];

      const result = await aprovarPedido(105, itens);
      expect(result).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        "/movimentacao/105/process",
        { action: "approve", status: "A", itens },
        expect.anything()
      );
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });

    it("rejeita pedido com motivo", async () => {
      const onSuccess = vi.fn();
      axios.post.mockResolvedValueOnce({ data: { status: true } });

      const { rejeitarPedido } = usePedidosStateMachine(onSuccess);

      const result = await rejeitarPedido(106, "Sem orçamento");
      expect(result).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        "/movimentacao/106/process",
        { action: "reject", status: "R", motivo_rejeicao: "Sem orçamento" },
        expect.anything()
      );
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });
});
