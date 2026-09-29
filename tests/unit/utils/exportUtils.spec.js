import { describe, it, expect, vi, beforeEach } from "vitest";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { exportToExcel, exportToPdf } from "@/utils/exportUtils";

vi.mock("xlsx", () => ({
  utils: {
    aoa_to_sheet: vi.fn(() => ({})),
    json_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({})),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

vi.mock("jspdf", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      setFontSize: vi.fn(),
      setFont: vi.fn(),
      text: vi.fn(),
      save: vi.fn(),
      internal: {
        getNumberOfPages: vi.fn(() => 1),
        pageSize: { width: 297, height: 210 },
      },
    })),
  };
});

vi.mock("jspdf-autotable", () => ({
  default: vi.fn(),
}));

describe("exportUtils.js - Utilitário de Exportação", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("exportToExcel", () => {
    it("não executa se data for vazia ou nula", () => {
      exportToExcel({ data: [] });
      expect(XLSX.writeFile).not.toHaveBeenCalled();
    });

    it("gera planilha a partir de matriz (aoa) e chama writeFile", () => {
      const data = [
        ["Produto", "Qtd"],
        ["Paracetamol", 10],
      ];
      const columns = [{ wch: 30 }, { wch: 10 }];

      exportToExcel({
        data,
        columns,
        filename: "teste_relatorio.xlsx",
        sheetName: "Estoque",
      });

      expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith(data);
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(expect.anything(), expect.anything(), "Estoque");
      expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), "teste_relatorio.xlsx");
    });

    it("adiciona extensão .xlsx automaticamente se omitida", () => {
      const data = [["A", "B"]];
      exportToExcel({ data, filename: "sem_extensao" });
      expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), "sem_extensao.xlsx");
    });
  });

  describe("exportToPdf", () => {
    it("não executa se body for vazio ou nulo", () => {
      exportToPdf({ body: [] });
      expect(jsPDF).not.toHaveBeenCalled();
    });

    it("instancia jsPDF, chama autoTable com tema striped e salva arquivo", () => {
      const head = [["Produto", "Qtd"]];
      const body = [["Paracetamol", "10"]];

      exportToPdf({
        title: "Relatório de Teste",
        subtitle: ["Data: 29/09/2026", "Setor: Farmácia"],
        head,
        body,
        filename: "relatorio_teste.pdf",
        orientation: "landscape",
      });

      expect(jsPDF).toHaveBeenCalledWith("landscape", "mm", "a4");
      expect(autoTable).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          head,
          body,
          theme: "striped",
        })
      );
    });
  });
});
