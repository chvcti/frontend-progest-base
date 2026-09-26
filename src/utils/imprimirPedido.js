/**
 * Gera e envia para impressão a via em papel de uma requisição (movimentação).
 *
 * Usado tanto pelo solicitante (Histórico de Pedidos) quanto pelo setor
 * distribuidor (aba Movimentações do setor), por isso todos os dados são
 * derivados do próprio pedido — nunca do setor/usuário logado, que é
 * diferente dependendo de quem está imprimindo.
 *
 * @param {Object} pedido - Movimentação com `itens`, `usuario`, `setor_origem` e `setor_destino`.
 * @returns {boolean} false quando a janela de impressão foi bloqueada pelo navegador.
 */

const formatarData = (valor) => {
  if (!valor) return "N/A";
  return new Date(valor).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};

const getStatusLabel = (status) => {
  const labels = {
    P: "Pendente",
    A: "Aprovado",
    R: "Rejeitado",
    C: "Rascunho",
    X: "Cancelado",
  };
  return labels[status] || status || "-";
};

const formatarSimpas = (valor) => {
  if (!valor) return "-";
  const s = String(valor).trim();
  if (/^\d{15}$/.test(s)) {
    return `${s.slice(0, 2)}.${s.slice(2, 4)}.${s.slice(4, 6)}.${s.slice(6, 14)}-${s.slice(14)}`;
  }
  return s;
};

const sanitizarLoteImpressao = (loteRaw) => {
  if (!loteRaw) return "-";
  try {
    let parsed = loteRaw;
    if (typeof loteRaw === "string" && (loteRaw.startsWith("[") || loteRaw.startsWith("{"))) {
      parsed = JSON.parse(loteRaw);
    }
    if (Array.isArray(parsed)) {
      if (!parsed.length) return "-";
      const lotes = parsed.map(l => {
        const cod = l?.lote || l?.numero_lote || l;
        return String(cod).replace(/\s*\([Vv]alidade:?[^)]*\)/g, "").replace(/^[Ll]ote:\s*/i, "").trim();
      }).filter(Boolean);
      return lotes.length ? lotes.join(", ") : "-";
    }
    if (typeof parsed === "object" && parsed !== null) {
      const cod = parsed.lote || parsed.numero_lote || "-";
      return String(cod).replace(/\s*\([Vv]alidade:?[^)]*\)/g, "").replace(/^[Ll]ote:\s*/i, "").trim() || "-";
    }
  } catch(e) {}

  const limpo = String(loteRaw)
    .replace(/\s*\([Vv]alidade:?[^)]*\)/g, "")
    .replace(/^[Ll]ote:\s*/i, "")
    .trim();
  return limpo || "-";
};

// Evita que nome de produto/observação vindos do banco quebrem o HTML gerado.
const escapar = (valor) =>
  String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function imprimirPedido(pedido) {
  if (!pedido) return false;

  const printWindow = window.open("", "_blank");
  if (!printWindow) return false;

  // O setor de origem é quem fornece; o de destino é quem solicitou.
  const setorFornecedor =
    pedido.setor_origem?.nome || pedido.setorOrigem?.nome || "N/A";
  const setorSolicitante =
    pedido.setor_destino?.nome || pedido.setorDestino?.nome || "N/A";
  const solicitante = pedido.usuario?.name || "N/A";
  const itens = pedido.itens || [];

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pedido #${pedido.id}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 10px;
          color: #333;
          line-height: 1.4;
          -webkit-print-color-adjust: exact;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #2563eb;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        
        .header-logo {
          width: 80px;
          height: 80px;
          background: #f1f5f9;
          border: 1px dashed #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: #94a3b8;
          text-align: center;
        }

        .header-titles {
          text-align: right;
        }

        .header h1 {
          color: #2563eb;
          font-size: 22px;
          margin-bottom: 3px;
        }

        .header .subtitle {
          color: #64748b;
          font-size: 14px;
        }

        .info-section {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          padding: 10px;
          margin-bottom: 15px;
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
        }

        .info-block {
          flex: 1;
          min-width: 150px;
        }

        .info-label {
          font-weight: 600;
          color: #475569;
          font-size: 12px;
          display: block;
        }

        .info-value {
          color: #1e293b;
          font-size: 13px;
        }

        .status-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .status-P { background: #fef3c7; color: #92400e; }
        .status-A { background: #d1fae5; color: #065f46; }
        .status-R { background: #fee2e2; color: #991b1b; }
        .status-C { background: #f3f4f6; color: #374151; }
        .status-X { background: #fee2e2; color: #991b1b; }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }

        .items-table thead {
          display: table-header-group;
          background: #2563eb;
          color: white;
        }

        .items-table tbody {
          display: table-row-group;
        }

        .items-table th {
          padding: 4px;
          text-align: left;
          font-weight: 600;
          font-size: 12px;
        }

        .items-table td {
          padding: 4px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 11px;
        }

        .items-table tr {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .items-table tbody tr:last-child td {
          border-bottom: 2px solid #2563eb;
        }

        .observacao-section {
          background: #fffbeb;
          border-left: 3px solid #f59e0b;
          padding: 8px;
          margin: 10px 0;
          border-radius: 4px;
          font-size: 12px;
        }

        .signatures-section {
          margin-top: 30px;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          padding: 10px;
        }
        
        .signatures-title {
          text-align: center;
          font-size: 11px;
          color: #64748b;
          margin-bottom: 35px;
          text-transform: uppercase;
          font-weight: bold;
        }

        .signatures {
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }

        .signature-box {
          text-align: center;
          flex: 1;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .signature-line {
          border-top: 1px solid #333;
          padding-top: 5px;
          font-size: 11px;
        }

        .footer {
          margin-top: 15px;
          text-align: center;
          color: #94a3b8;
          font-size: 10px;
        }

        @media print {
          @page {
            size: landscape;
            margin: 8mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .items-table thead {
            display: table-header-group !important;
          }
          .items-table tbody {
            display: table-row-group !important;
          }
          .items-table tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-logo">
          LOGO<br>HOSPITAL
        </div>
        <div class="header-titles">
          <h1>REQUISIÇÃO DE MATERIAIS</h1>
          <p class="subtitle">Pedido #${pedido.id}</p>
        </div>
      </div>

      <div class="info-section">
        <div class="info-block">
          <span class="info-label">Data do Pedido:</span>
          <span class="info-value">${formatarData(pedido.data_hora || pedido.created_at)}</span>
        </div>
        <div class="info-block">
          <span class="info-label">Solicitante:</span>
          <span class="info-value">${escapar(solicitante)}</span>
        </div>
        <div class="info-block">
          <span class="info-label">Setor Solicitante:</span>
          <span class="info-value">${escapar(setorSolicitante)}</span>
        </div>
        <div class="info-block">
          <span class="info-label">Setor Fornecedor:</span>
          <span class="info-value">${escapar(setorFornecedor)}</span>
        </div>
        <div class="info-block">
          <span class="info-label">Status:</span>
          <span class="info-value">
            <span class="status-badge status-${pedido.status_solicitacao}">
              ${getStatusLabel(pedido.status_solicitacao)}
            </span>
          </span>
        </div>
      </div>

      ${
        pedido.observacao
          ? `
        <div class="observacao-section">
          <strong>Observação:</strong> ${escapar(pedido.observacao)}
        </div>
      `
          : ""
      }

      <table class="items-table">
        <thead>
          <tr>
            <th style="width: 40px;">#</th>
            <th style="width: 130px;">Cód. SIMPAS</th>
            <th>Descrição do Item</th>
            <th style="width: 80px;">Unidade</th>
            <th style="width: 120px;">Lote</th>
            <th style="width: 90px; text-align: center;">Qtd. Solicitada</th>
            <th style="width: 90px; text-align: center;">Qtd. Atendida</th>
          </tr>
        </thead>
        <tbody>
          ${itens
            .map(
              (item, index) => `
            <tr>
              <td style="text-align: center; font-weight: bold;">${index + 1}</td>
              <td>${escapar(formatarSimpas(item.produto?.codigo_simpas))}</td>
              <td>${escapar(item.produto?.nome || `Produto #${item.produto_id}`)}</td>
              <td>${escapar(item.produto?.unidade_medida?.nome || item.produto?.unidadeMedida?.nome || "-")}</td>
              <td>
                ${escapar(pedido.status_solicitacao === 'A' ? sanitizarLoteImpressao(item.lote) : '-')}
              </td>
              <td style="text-align: center; font-weight: bold;">${item.quantidade_solicitada}</td>
              <td style="text-align: center; font-weight: bold; color: ${
                item.quantidade_liberada > 0 ? "#059669" : "#64748b"
              };">
                ${item.quantidade_liberada || "-"}
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>

      <div class="signatures-section">
        <div class="signatures-title">Carimbar ou assinar por extenso</div>
        <div class="signatures">
          <div class="signature-box">
            <div class="signature-line">
              <strong>1. Solicitado por:</strong><br>
              <span style="color: #64748b;">${escapar(solicitante)}</span>
            </div>
          </div>
          <div class="signature-box">
            <div class="signature-line">
              <strong>2. Autorizado por:</strong><br>
              <span style="color: #64748b;">&nbsp;</span>
            </div>
          </div>
          <div class="signature-box">
            <div class="signature-line">
              <strong>3. Atendido por:</strong><br>
              <span style="color: #64748b;">Setor: ${escapar(setorFornecedor)}</span>
            </div>
          </div>
          <div class="signature-box">
            <div class="signature-line">
              <strong>4. Recebido por:</strong><br>
              <span style="color: #64748b;">&nbsp;</span>
            </div>
          </div>
        </div>
      </div>

      <div class="footer">
        Documento gerado em ${formatarData(new Date())} - Sistema de Gestão de Estoque - ProGest HGVC
      </div>

      <${"script"}>
        window.onload = function() {
          window.print();
        };
      </${"script"}>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  return true;
}

export default imprimirPedido;
