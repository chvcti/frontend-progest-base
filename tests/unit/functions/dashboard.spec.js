import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDashboardMetrics } from "@/functions/dashboard";
import axios from "axios";

vi.mock("axios");

describe("dashboard.js - Serviço de Métricas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("busca métricas do dashboard passando setor_id com sucesso", async () => {
    const mockData = {
      stats: {
        totalItens: 15,
        abaixoMinimo: 3,
        pendentesEntrada: 2,
        pendentesSaida: 1,
        pedidosEntreguesMes: 0,
        itensSolicitadosMes: 0,
      },
      alerts: [{ id: 1, quantidade_atual: 2, quantidade_minima: 10 }],
      recentRequests: [{ id: 101, status_solicitacao: "P" }],
    };

    axios.get.mockResolvedValueOnce({
      data: {
        status: true,
        data: mockData,
      },
    });

    const result = await getDashboardMetrics({ setorId: 63 });

    expect(axios.get).toHaveBeenCalledWith("/dashboard/metrics", {
      params: { setor_id: 63 },
    });
    expect(result.status).toBe(true);
    expect(result.data).toEqual(mockData);
  });

  it("trata falha de status retornado da API", async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        status: false,
        message: "Erro no servidor",
      },
    });

    const result = await getDashboardMetrics(63);

    expect(result.status).toBe(false);
    expect(result.message).toBe("Erro no servidor");
    expect(result.data).toBeNull();
  });

  it("trata exceção de rede ou erro HTTP", async () => {
    axios.get.mockRejectedValueOnce({
      response: {
        data: { message: "Não autorizado" },
      },
    });

    const result = await getDashboardMetrics({ setorId: 63 });

    expect(result.status).toBe(false);
    expect(result.message).toBe("Não autorizado");
  });
});
