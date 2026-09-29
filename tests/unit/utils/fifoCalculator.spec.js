import { describe, it, expect } from "vitest";
import { calcularAlocacaoFifo } from "@/utils/fifoCalculator";

describe("fifoCalculator.js - Cálculo Analítico de FIFO", () => {
  it("retorna alocação vazia quando a quantidade necessária é zero ou negativa", () => {
    const lotes = [{ id: 1, quantidade_disponivel: 10 }];

    expect(calcularAlocacaoFifo(lotes, 0)).toEqual({
      lotes_alocados: [],
      quantidade_sem_cobertura: 0,
    });

    expect(calcularAlocacaoFifo(lotes, -5)).toEqual({
      lotes_alocados: [],
      quantidade_sem_cobertura: 0,
    });
  });

  it("retorna sem cobertura total se lista de lotes for vazia", () => {
    const res = calcularAlocacaoFifo([], 15);
    expect(res).toEqual({
      lotes_alocados: [],
      quantidade_sem_cobertura: 15,
    });
  });

  it("aloca integralmente de um único lote quando há saldo suficiente", () => {
    const lotes = [
      { id: 101, lote: "LOTE-A", quantidade_disponivel: 50 },
    ];

    const res = calcularAlocacaoFifo(lotes, 20);

    expect(res.quantidade_sem_cobertura).toBe(0);
    expect(res.lotes_alocados).toHaveLength(1);
    expect(res.lotes_alocados[0]).toEqual({
      id: 101,
      lote: "LOTE-A",
      quantidade_disponivel: 50,
      quantidade_a_usar: 20,
    });
  });

  it("distribui entre múltiplos lotes respeitando a ordem FIFO", () => {
    const lotes = [
      { id: 1, lote: "LOTE-1", quantidade_disponivel: 10 },
      { id: 2, lote: "LOTE-2", quantidade_disponivel: 15 },
      { id: 3, lote: "LOTE-3", quantidade_disponivel: 30 },
    ];

    const res = calcularAlocacaoFifo(lotes, 22);

    expect(res.quantidade_sem_cobertura).toBe(0);
    expect(res.lotes_alocados).toHaveLength(2);

    // Primeiro lote esgotado (10)
    expect(res.lotes_alocados[0].id).toBe(1);
    expect(res.lotes_alocados[0].quantidade_a_usar).toBe(10);

    // Segundo lote consome restante (12)
    expect(res.lotes_alocados[1].id).toBe(2);
    expect(res.lotes_alocados[1].quantidade_a_usar).toBe(12);
  });

  it("calcula corretamente quantidade_sem_cobertura quando o estoque total é insuficiente", () => {
    const lotes = [
      { id: 1, lote: "LOTE-1", quantidade_disponivel: 5 },
      { id: 2, lote: "LOTE-2", quantidade_disponivel: 3 },
    ];

    const res = calcularAlocacaoFifo(lotes, 10);

    expect(res.quantidade_sem_cobertura).toBe(2);
    expect(res.lotes_alocados).toHaveLength(2);
    expect(res.lotes_alocados[0].quantidade_a_usar).toBe(5);
    expect(res.lotes_alocados[1].quantidade_a_usar).toBe(3);
  });

  it("ignora lotes com saldo zerado ou negativo", () => {
    const lotes = [
      { id: 1, lote: "LOTE-VAZIO", quantidade_disponivel: 0 },
      { id: 2, lote: "LOTE-NEGATIVO", quantidade_disponivel: -2 },
      { id: 3, lote: "LOTE-VALIDO", quantidade_disponivel: 8 },
    ];

    const res = calcularAlocacaoFifo(lotes, 5);

    expect(res.quantidade_sem_cobertura).toBe(0);
    expect(res.lotes_alocados).toHaveLength(1);
    expect(res.lotes_alocados[0].id).toBe(3);
    expect(res.lotes_alocados[0].quantidade_a_usar).toBe(5);
  });
});
