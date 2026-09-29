import { describe, it, expect } from "vitest";
import {
  calcularSubtotalItem,
  calcularValorUnitario,
  calcularTotalItens,
  calcularTotalQuantidade,
  calcularTotalNota,
  calcularRateioFreteDesconto,
} from "@/utils/entradaCalculators";

describe("entradaCalculators.js - Cálculos Financeiros e Rateio", () => {
  describe("calcularSubtotalItem", () => {
    it("calcula subtotal corretamente multiplicando quantidade e valor unitário", () => {
      expect(calcularSubtotalItem(10, 2.5)).toBe(25);
      expect(calcularSubtotalItem(3, 19.99)).toBe(59.97);
    });

    it("retorna 0 para quantidades ou valores zerados/negativos", () => {
      expect(calcularSubtotalItem(0, 10)).toBe(0);
      expect(calcularSubtotalItem(5, 0)).toBe(0);
      expect(calcularSubtotalItem(-5, 10)).toBe(0);
    });
  });

  describe("calcularValorUnitario", () => {
    it("retorna valor unitário direto quando tipoValor for unitario", () => {
      expect(calcularValorUnitario(15.5, 10, "unitario")).toBe(15.5);
    });

    it("divide o valor total pela quantidade quando tipoValor for total", () => {
      expect(calcularValorUnitario(100, 4, "total")).toBe(25);
      expect(calcularValorUnitario(100, 3, "total")).toBe(33.3333);
    });

    it("retorna null para valores vazios ou inválidos", () => {
      expect(calcularValorUnitario("", 10)).toBeNull();
      expect(calcularValorUnitario(null, 10)).toBeNull();
      expect(calcularValorUnitario(100, 0, "total")).toBeNull();
    });
  });

  describe("calcularTotalItens e calcularTotalQuantidade", () => {
    const itens = [
      { quantidade: 10, valor_unitario: 5 },
      { quantidade: 2, valor_unitario: 50 },
      { quantidade: 5, valor_unitario: 10.5 },
    ];

    it("soma subtotais de todos os itens", () => {
      expect(calcularTotalItens(itens)).toBe(202.5); // 50 + 100 + 52.5
    });

    it("soma total de unidades", () => {
      expect(calcularTotalQuantidade(itens)).toBe(17);
    });
  });

  describe("calcularTotalNota", () => {
    const itens = [
      { quantidade: 10, valor_unitario: 10 }, // 100
      { quantidade: 5, valor_unitario: 20 },  // 100
    ];

    it("calcula total considerando frete, outras despesas e desconto", () => {
      // 200 (itens) + 30 (frete) + 10 (outras) - 20 (desconto) = 220
      const total = calcularTotalNota({
        itens,
        frete: 30,
        outrasDespesas: 10,
        desconto: 20,
      });
      expect(total).toBe(220);
    });
  });

  describe("calcularRateioFreteDesconto", () => {
    const itens = [
      { id: 1, quantidade: 10, valor_unitario: 10 }, // subtotal 100 (50%)
      { id: 2, quantidade: 5, valor_unitario: 20 },  // subtotal 100 (50%)
    ];

    it("rateia proporcionalmente frete e desconto entre os itens", () => {
      const rateado = calcularRateioFreteDesconto({
        itens,
        frete: 20,
        desconto: 10,
      });

      expect(rateado).toHaveLength(2);
      expect(rateado[0].rateioFrete).toBe(10);
      expect(rateado[0].rateioDesconto).toBe(5);
      expect(rateado[0].custoTotalItem).toBe(105); // 100 + 10 - 5
      expect(rateado[0].custoEfetivoUnitario).toBe(10.5); // 105 / 10

      expect(rateado[1].rateioFrete).toBe(10);
      expect(rateado[1].rateioDesconto).toBe(5);
      expect(rateado[1].custoTotalItem).toBe(105);
      expect(rateado[1].custoEfetivoUnitario).toBe(21); // 105 / 5
    });
  });
});
