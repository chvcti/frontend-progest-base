import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Utilitário Centralizado de Exportação de Dados
 * Fornece métodos padronizados para geração e download de arquivos Excel (.xlsx) e PDF (.pdf).
 */

/**
 * Exporta dados para uma planilha Excel (.xlsx).
 *
 * @param {Object} options
 * @param {Array<Array<any>>|Array<Object>} options.data - Matriz bidimensional de dados ou array de objetos
 * @param {Array<Object>|Array<number>} [options.columns] - Definição de larguras das colunas ({ wch: 20 })
 * @param {string} [options.filename] - Nome do arquivo a ser salvo
 * @param {string} [options.sheetName] - Nome da aba da planilha
 */
export function exportToExcel({ data, columns = [], filename, sheetName = 'Sheet1' }) {
  if (!data || !Array.isArray(data) || data.length === 0) return;

  const isAoa = Array.isArray(data[0]);
  const ws = isAoa ? XLSX.utils.aoa_to_sheet(data) : XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();

  const safeSheetName = (sheetName || 'Planilha').toString().slice(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName);

  if (Array.isArray(columns) && columns.length > 0) {
    ws['!cols'] = columns.map((col) => (typeof col === 'number' ? { wch: col } : col));
  }

  const safeFilename = filename
    ? (filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`)
    : `export_${new Date().toISOString().slice(0, 10)}.xlsx`;

  XLSX.writeFile(wb, safeFilename);
}

/**
 * Exporta dados tabulares para um documento PDF estruturado com paginação automática.
 *
 * @param {Object} options
 * @param {string} options.title - Título do relatório
 * @param {string|Array<string>} [options.subtitle] - Subtítulo ou linhas de metadados
 * @param {Array<Array<string>>} options.head - Linhas de cabeçalho da tabela
 * @param {Array<Array<any>>} options.body - Matriz de dados das linhas
 * @param {string} [options.filename] - Nome do arquivo PDF
 * @param {'portrait'|'landscape'} [options.orientation='portrait'] - Orientação da página
 * @param {Object} [options.columnStyles={}] - Estilos específicos de cada coluna
 * @param {Object} [options.headStyles={}] - Estilos do cabeçalho da tabela
 * @param {Object} [options.bodyStyles={}] - Estilos do corpo da tabela
 * @param {number} [options.startY] - Posição vertical inicial da tabela
 * @param {Function} [options.beforeTable] - Callback executado antes do autoTable com ({ doc })
 * @param {Function} [options.afterTable] - Callback executado após o autoTable com ({ doc, finalY })
 */
export function exportToPdf({
  title,
  subtitle = null,
  head,
  body,
  filename,
  orientation = 'portrait',
  columnStyles = {},
  headStyles = {},
  bodyStyles = {},
  startY = null,
  beforeTable = null,
  afterTable = null,
}) {
  if (!body || !Array.isArray(body) || body.length === 0) return;

  const doc = new jsPDF(orientation, 'mm', 'a4');
  let currentY = 15;

  if (title) {
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(title, 14, currentY);
    currentY += 6;
    doc.setFont(undefined, 'normal');
  }

  if (subtitle) {
    doc.setFontSize(9);
    const subtitleLines = Array.isArray(subtitle) ? subtitle : [subtitle];
    for (const line of subtitleLines) {
      if (line) {
        doc.text(String(line), 14, currentY);
        currentY += 5;
      }
    }
  }

  if (typeof beforeTable === 'function') {
    beforeTable({ doc });
  }

  const calculatedStartY = startY ?? Math.max(currentY + 2, 28);

  const defaultHeadStyles = {
    fillColor: [13, 110, 253],
    fontSize: 8,
    fontStyle: 'bold',
    ...headStyles,
  };

  const defaultBodyStyles = {
    fontSize: 7,
    ...bodyStyles,
  };

  autoTable(doc, {
    startY: calculatedStartY,
    head: head,
    body: body,
    theme: 'striped',
    headStyles: defaultHeadStyles,
    bodyStyles: defaultBodyStyles,
    columnStyles: columnStyles,
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.text(
        `Pagina ${data.pageNumber} de ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 8,
        { align: 'center' }
      );
    },
  });

  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : currentY;

  if (typeof afterTable === 'function') {
    afterTable({ doc, finalY });
  }

  const safeFilename = filename
    ? (filename.endsWith('.pdf') ? filename : `${filename}.pdf`)
    : `export_${new Date().toISOString().slice(0, 10)}.pdf`;

  doc.save(safeFilename);
}
