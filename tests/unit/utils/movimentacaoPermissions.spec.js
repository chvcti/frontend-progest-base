import { describe, it, expect } from "vitest";
import {
  isEntradaMovimentacao,
  isSaidaMovimentacao,
  podeAprovarMovimentacao,
  podeCancelarMovimentacao,
  podeEditarRascunho,
  podeDevolverMovimentacao,
} from "@/utils/movimentacaoPermissions";

describe("movimentacaoPermissions.js - Governança e Permissões", () => {
  const setorAId = 10;
  const setorBId = 20;

  describe("isEntradaMovimentacao & isSaidaMovimentacao", () => {
    it("identifica corretamente entrada por setor_destino_id ou setorDestino.id", () => {
      const mov1 = { setor_destino_id: 10, setor_origem_id: 20 };
      const mov2 = { setorDestino: { id: 10 }, setorOrigem: { id: 20 } };

      expect(isEntradaMovimentacao(mov1, setorAId)).toBe(true);
      expect(isEntradaMovimentacao(mov2, setorAId)).toBe(true);
      expect(isEntradaMovimentacao(mov1, setorBId)).toBe(false);
      expect(isEntradaMovimentacao(null, setorAId)).toBe(false);
    });

    it("identifica corretamente saída por setor_origem_id ou setorOrigem.id", () => {
      const mov1 = { setor_destino_id: 10, setor_origem_id: 20 };
      const mov2 = { setorDestino: { id: 10 }, setorOrigem: { id: 20 } };

      expect(isSaidaMovimentacao(mov1, setorBId)).toBe(true);
      expect(isSaidaMovimentacao(mov2, setorBId)).toBe(true);
      expect(isSaidaMovimentacao(mov1, setorAId)).toBe(false);
      expect(isSaidaMovimentacao(null, setorBId)).toBe(false);
    });
  });

  describe("podeAprovarMovimentacao", () => {
    it("não permite aprovação se status não for 'P'", () => {
      const mov = { status_solicitacao: "A", tipo: "T", setor_origem_id: setorAId };
      expect(podeAprovarMovimentacao(mov, setorAId, true)).toBe(false);
    });

    it("não permite aprovação se usuário não tiver permissão", () => {
      const mov = { status_solicitacao: "P", tipo: "T", setor_origem_id: setorAId };
      expect(podeAprovarMovimentacao(mov, setorAId, false)).toBe(false);
      expect(podeAprovarMovimentacao(mov, setorAId, { isAdmin: false, isAlmoxarife: false })).toBe(false);
    });

    it("em transferência comum (T/S), aprovação é feita pelo setor de origem (fornecedor)", () => {
      const mov = { status_solicitacao: "P", tipo: "T", setor_origem_id: setorAId, setor_destino_id: setorBId };

      // Setor de origem com permissão -> pode aprovar
      expect(podeAprovarMovimentacao(mov, setorAId, true)).toBe(true);
      expect(podeAprovarMovimentacao(mov, setorAId, { isAlmoxarife: true })).toBe(true);

      // Setor de destino (solicitante) -> NÃO pode aprovar
      expect(podeAprovarMovimentacao(mov, setorBId, true)).toBe(false);
    });

    it("em devolução (D), aprovação é feita pelo setor de destino (quem recebe de volta)", () => {
      const mov = { status_solicitacao: "P", tipo: "D", setor_origem_id: setorAId, setor_destino_id: setorBId };

      // Setor de destino (recebedor da devolução) com permissão -> pode aprovar
      expect(podeAprovarMovimentacao(mov, setorBId, true)).toBe(true);

      // Setor de origem (devolvente) -> NÃO pode aprovar
      expect(podeAprovarMovimentacao(mov, setorAId, true)).toBe(false);
    });
  });

  describe("podeCancelarMovimentacao", () => {
    it("não permite cancelamento se status não for 'P'", () => {
      const mov = { status_solicitacao: "A", tipo: "T", setor_destino_id: setorBId };
      expect(podeCancelarMovimentacao(mov, setorBId)).toBe(false);
    });

    it("em transferência comum, apenas o setor de destino (solicitante) pode cancelar", () => {
      const mov = { status_solicitacao: "P", tipo: "T", setor_origem_id: setorAId, setor_destino_id: setorBId };

      expect(podeCancelarMovimentacao(mov, setorBId)).toBe(true);
      expect(podeCancelarMovimentacao(mov, setorAId)).toBe(false);
    });

    it("em devolução (D), apenas o setor de origem (solicitante da devolução) pode cancelar", () => {
      const mov = { status_solicitacao: "P", tipo: "D", setor_origem_id: setorAId, setor_destino_id: setorBId };

      expect(podeCancelarMovimentacao(mov, setorAId)).toBe(true);
      expect(podeCancelarMovimentacao(mov, setorBId)).toBe(false);
    });
  });

  describe("podeEditarRascunho", () => {
    it("não permite editar se status não for 'C' (Rascunho)", () => {
      const mov = { status_solicitacao: "P", tipo: "T", setor_destino_id: setorBId };
      expect(podeEditarRascunho(mov, setorBId)).toBe(false);
    });

    it("em pedido comum, permite editar rascunho se for entrada (solicitante)", () => {
      const mov = { status_solicitacao: "C", tipo: "T", setor_origem_id: setorAId, setor_destino_id: setorBId };

      expect(podeEditarRascunho(mov, setorBId)).toBe(true);
      expect(podeEditarRascunho(mov, setorAId)).toBe(false);
    });

    it("em devolução, permite editar rascunho se for saída (devolvente)", () => {
      const mov = { status_solicitacao: "C", tipo: "D", setor_origem_id: setorAId, setor_destino_id: setorBId };

      expect(podeEditarRascunho(mov, setorAId)).toBe(true);
      expect(podeEditarRascunho(mov, setorBId)).toBe(false);
    });
  });

  describe("podeDevolverMovimentacao", () => {
    it("permite devolução se for uma entrada aprovada e não for do tipo 'D'", () => {
      const movAprovada = { status_solicitacao: "A", tipo: "T", setor_origem_id: setorAId, setor_destino_id: setorBId };
      expect(podeDevolverMovimentacao(movAprovada, setorBId)).toBe(true);
      expect(podeDevolverMovimentacao(movAprovada, setorAId)).toBe(false);
    });

    it("não permite devolver pedidos que não estejam aprovados", () => {
      const movPendente = { status_solicitacao: "P", tipo: "T", setor_destino_id: setorBId };
      expect(podeDevolverMovimentacao(movPendente, setorBId)).toBe(false);
    });

    it("não permite devolver pedidos que já são do tipo devolução (tipo D)", () => {
      const movDevolucao = { status_solicitacao: "A", tipo: "D", setor_destino_id: setorBId };
      expect(podeDevolverMovimentacao(movDevolucao, setorBId)).toBe(false);
    });
  });
});
