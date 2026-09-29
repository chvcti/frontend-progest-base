<template>
  <TemplateAdmin>
    <div class="main-content">
      <div class="page-content">
        <div class="container-fluid py-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h4>Relatório de Movimentações</h4>
              <p class="text-muted mb-0">Visão agregada de transferências, saídas e devoluções.</p>
            </div>
            <div>
              <button class="btn btn-outline-secondary me-2" @click="resetFilters">Limpar</button>
              <button class="btn btn-primary" @click="loadMovimentacoes">Atualizar</button>
            </div>
          </div>

          <div class="card mb-3">
            <div class="card-body">
              <div class="row">
                <div class="col-md-2">
                  <label class="form-label">Data início</label>
                  <input type="date" v-model="filters.date_from" class="form-control" />
                </div>
                <div class="col-md-2">
                  <label class="form-label">Data fim</label>
                  <input type="date" v-model="filters.date_to" class="form-control" />
                </div>
                <div class="col-md-2">
                  <label class="form-label">Tipo</label>
                  <select v-model="filters.tipo" class="form-select">
                    <option value="">Todos</option>
                    <option value="T">Transferência</option>
                    <option value="S">Saída</option>
                    <option value="D">Devolução</option>
                  </select>
                </div>
                <div class="col-md-2">
                  <label class="form-label">Polo</label>
                  <select v-model.number="filters.polo_id" class="form-select" @change="onPoloChange">
                    <option :value="''">Todas</option>
                    <option v-for="p in polos" :key="p.id" :value="p.id">{{ p.nome }}</option>
                  </select>
                </div>
                <div class="col-md-2">
                  <label class="form-label">Setor</label>
                  <select v-model.number="filters.setor_id" class="form-select">
                    <option :value="''">Todos</option>
                    <option v-for="s in setoresFiltrados" :key="s.id" :value="s.id">{{ s.nome }}</option>
                  </select>
                </div>
                <div class="col-md-2 d-flex align-items-end justify-content-end">
                  <button class="btn btn-outline-success me-2" @click="exportExcel" :disabled="movimentacoes.length===0">Exportar Excel</button>
                  <button class="btn btn-outline-danger" @click="exportPdf" :disabled="movimentacoes.length===0">Exportar PDF</button>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-body">
              <div v-if="loading" class="text-center py-4">Carregando...</div>
              <div v-else>
                <div class="mb-3">Total de movimentações: <strong>{{ movimentacoes.length }}</strong></div>
                <div class="table-responsive">
                  <table class="table table-striped">
                    <thead>
                      <tr>
                        <th style="width: 50px;"></th>
                        <th>ID</th>
                        <th>Data/Hora</th>
                        <th>Tipo</th>
                        <th>Solicitante</th>
                        <th>Setor Origem</th>
                        <th>Setor Destino</th>
                        <th>Total Itens</th>
                        <th>Status</th>
                        <th>Observação</th>
                      </tr>
                    </thead>
                    <tbody>
                      <template v-for="m in movimentacoes" :key="m.id">
                        <!-- Linha principal da movimentação -->
                        <tr class="movimentacao-row" @click="toggleRow(m.id)" style="cursor: pointer;">
                          <td>
                            <span class="material-icons expand-icon" :class="{ 'expanded': expandedRows[m.id] }">
                              {{ expandedRows[m.id] ? 'expand_more' : 'chevron_right' }}
                            </span>
                          </td>
                          <td>{{ m.id }}</td>
                          <td class="small">{{ formatDateTime(m.data_hora || m.created_at) }}</td>
                          <td><span class="badge" :class="getTipoBadge(m.tipo)">{{ getTipoLabel(m.tipo) }}</span></td>
                          <td class="small">{{ m.usuario?.name || '-' }}</td>
                          <td>{{ m.setor_origem?.nome || '-' }}</td>
                          <td>{{ m.setor_destino?.nome || '-' }}</td>
                          <td>
                            <span class="badge bg-info">{{ m.itens?.length || 0 }} itens</span>
                          </td>
                          <td>
                            <span class="badge" :class="getStatusSolicitacaoBadge(m.status_solicitacao)">
                              {{ getStatusSolicitacaoLabel(m.status_solicitacao) }}
                            </span>
                          </td>
                          <td class="small text-muted" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ m.observacao || '-' }}</td>
                        </tr>
                        
                        <!-- Linha expansível com tabela de produtos -->
                        <tr v-if="expandedRows[m.id]" class="expanded-content">
                          <td colspan="10" class="p-0">
                            <div class="produtos-container">
                              <div class="mb-2 d-flex gap-3">
                                <div v-if="m.aprovador">
                                  <strong>Aprovador:</strong> <span class="text-muted">{{ m.aprovador.name }}</span>
                                </div>
                                <div v-if="m.observacao">
                                  <strong>Observação completa:</strong> <span class="text-muted">{{ m.observacao }}</span>
                                </div>
                              </div>
                              <table class="table table-sm mb-0">
                                <thead class="table-light">
                                  <tr>
                                    <th>Qtd. Solicitada</th>
                                    <th>Qtd. Liberada</th>
                                    <th>Produto</th>
                                    <th>Cód. SIMPAS</th>
                                    <th>Cód. Barras</th>
                                    <th>Lote</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr v-if="!m.itens || m.itens.length === 0">
                                    <td colspan="6" class="text-center text-muted">Nenhum produto nesta movimentação</td>
                                  </tr>
                                  <tr v-else v-for="(item, idx) in m.itens" :key="idx">
                                    <td>
                                      <span class="badge bg-primary">{{ item.quantidade_solicitada || item.quantidade }}</span>
                                    </td>
                                    <td>
                                      <span class="badge" :class="item.quantidade_liberada === item.quantidade_solicitada ? 'bg-success' : 'bg-warning'">{{ item.quantidade_liberada || item.quantidade }}</span>
                                    </td>
                                    <td class="fw-semibold">{{ item.produto?.nome || `Produto #${item.produto_id}` }}</td>
                                    <td class="text-muted small">{{ formatarSimpas(item.produto?.codigo_simpas) }}</td>
                                    <td class="text-muted small">{{ item.produto?.codigo_barras || '-' }}</td>
                                    <td class="text-muted small">{{ formatarLote(item.lote) }}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      </template>
                    </tbody>
                  </table>
                </div>
                <div v-if="movimentacoes.length===0" class="text-center py-4 text-muted">Nenhuma movimentação encontrada</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </TemplateAdmin>
</template>

<script>
import TemplateAdmin from '@/views/roleAdmin/TemplateAdmin.vue'
import functionsRelatorios from '@/functions/cad_relatorios.js'
import functionsPolos from '@/functions/cad_unidades_polos.js'
import functionsSetores from '@/functions/cad_setores.js'
import { exportToExcel, exportToPdf } from '@/utils/exportUtils'

export default {
  name: 'MovimentacoesReport',
  components: { TemplateAdmin },
  data() {
    const hoje = this.getTodayDate();
    return {
      filters: {
        date_from: hoje,
        date_to: hoje,
        tipo: '',
        polo_id: '',
        setor_id: '',
      },
      movimentacoes: [],
      loading: false,
      expandedRows: {}, // Controla quais linhas estão expandidas
    }
  },
  mounted() {
    functionsPolos.listAll(this);
    functionsSetores.listAll(this);
    this.loadMovimentacoes();
  },
  computed: {
    polos() {
      return this.$store.state.cadastros.listPolos || [];
    },
    setores() {
      const setoresData = this.$store.state.cadastros.listSetoresGerais;
      if (Array.isArray(setoresData)) {
        return setoresData;
      } else if (setoresData?.data && Array.isArray(setoresData.data)) {
        return setoresData.data;
      }
      return [];
    },
    setoresFiltrados() {
      if (!this.filters.polo_id) {
        return this.setores;
      }
      return this.setores.filter(s => s.polo_id == this.filters.polo_id);
    }
  },
  methods: {
    getTodayDate() {
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const dia = String(hoje.getDate()).padStart(2, '0');
      return `${ano}-${mes}-${dia}`;
    },
    toggleRow(movimentacaoId) {
      this.expandedRows[movimentacaoId] = !this.expandedRows[movimentacaoId];
    },
    onPoloChange() {
      // Limpa o filtro de setor quando muda a unidade
      this.filters.setor_id = '';
    },
    async loadMovimentacoes() {
      this.loading = true;
      try {
        const payloadFilters = {};
        if (this.filters.date_from) payloadFilters.date_from = this.filters.date_from;
        if (this.filters.date_to) payloadFilters.date_to = this.filters.date_to;
        if (this.filters.tipo) payloadFilters.tipo = this.filters.tipo;
        if (this.filters.polo_id) payloadFilters.polo_id = this.filters.polo_id;
        if (this.filters.setor_id) payloadFilters.setor_id = this.filters.setor_id;

        const result = await functionsRelatorios.listMovimentacoesReport(this, payloadFilters);
        if (result && result.success) {
          this.movimentacoes = result.data || [];
          // Expandir todas as linhas por padrão
          this.expandedRows = {};
          this.movimentacoes.forEach(mov => {
            this.expandedRows[mov.id] = true;
          });
        } else {
          this.movimentacoes = [];
        }
      } catch (e) {
        console.error('Erro ao carregar relatório de movimentações:', e);
        this.movimentacoes = [];
      } finally {
        this.loading = false;
      }
    },
    resetFilters() {
      const hoje = this.getTodayDate();
      this.filters.date_from = hoje;
      this.filters.date_to = hoje;
      this.filters.tipo = '';
      this.filters.polo_id = '';
      this.filters.setor_id = '';
      this.loadMovimentacoes();
    },
    formatDate(d) {
      if (!d) return '-';
      const str = String(d).split('T')[0];
      const parts = str.split('-');
      if (parts.length<3) return d;
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    },
    formatDateTime(d) {
      if (!d) return '-';
      const str = String(d).replace('T', ' ').split('.')[0];
      const [date, time] = str.split(' ');
      const parts = date.split('-');
      if (parts.length < 3) return d;
      return `${parts[2]}/${parts[1]}/${parts[0]} ${time}`;
    },
    getTipoBadge(tipo) {
      const mapa = {
        'T': 'bg-info',
        'S': 'bg-warning',
        'D': 'bg-success',
      };
      return mapa[tipo] || 'bg-secondary';
    },
    getTipoLabel(tipo) {
      const mapa = {
        'T': 'Transferência',
        'S': 'Saída',
        'D': 'Devolução',
      };
      return mapa[tipo] || tipo;
    },
    getStatusSolicitacaoBadge(status) {
      const mapa = {
        'A': 'bg-success',
        'P': 'bg-warning',
        'R': 'bg-danger',
        'C': 'bg-secondary',
      };
      return mapa[status] || 'bg-secondary';
    },
    getStatusSolicitacaoLabel(status) {
      const mapa = {
        'A': 'Aprovada',
        'P': 'Pendente',
        'R': 'Rejeitada',
        'C': 'Cancelada',
      };
      return mapa[status] || status || '-';
    },
    getStatusBadge(status) {
      return status === 'A' ? 'bg-success' : 'bg-danger';
    },
    formatarSimpas(codigo) {
      if (!codigo) return '-';
      const s = String(codigo).trim();
      if (/^\d{15}$/.test(s)) {
        return `${s.slice(0, 2)}.${s.slice(2, 4)}.${s.slice(4, 6)}.${s.slice(6, 14)}-${s.slice(14)}`;
      }
      return s;
    },
    formatarLote(lote) {
      if (!lote) return '-';
      if (typeof lote === 'object') {
        if (Array.isArray(lote)) {
          const lotes = lote.map(x => x?.lote || x?.numero_lote || x).filter(Boolean);
          return lotes.length ? lotes.join(', ') : '-';
        }
        return lote.lote || lote.numero_lote || '-';
      }
      const str = String(lote).trim();
      if (str === '' || str === '-' || str.toLowerCase() === 'null') return '-';
      if (str.startsWith('[') || str.startsWith('{')) {
        try {
          const parsed = JSON.parse(str);
          return this.formatarLote(parsed);
        } catch (e) {}
      }
      const limpo = str.replace(/\s*\([Vv]alidade:?[^)]*\)/g, '').replace(/^[Ll]ote:\s*/i, '').trim();
      return limpo || '-';
    },
    exportExcel() {
      if (!this.movimentacoes || this.movimentacoes.length===0) return;
      
      // Preparar dados para o Excel
      const data = [];
      
      // Cabeçalho
      data.push(['ID','Data/Hora','Tipo','Solicitante','Aprovador','Setor Origem','Setor Destino','Status','Qtd.Solicitada','Qtd.Liberada','Produto','Cód. SIMPAS','Cód.Barras','Lote','Observação']);
      
      // Dados
      for (const m of this.movimentacoes) {
        if (m.itens && m.itens.length > 0) {
          m.itens.forEach(item => {
            data.push([
              m.id,
              this.formatDateTime(m.data_hora || m.created_at),
              this.getTipoLabel(m.tipo),
              m.usuario?.name || '',
              m.aprovador?.name || '',
              m.setor_origem?.nome || '',
              m.setor_destino?.nome || '',
              this.getStatusSolicitacaoLabel(m.status_solicitacao),
              item.quantidade_solicitada || item.quantidade || '',
              item.quantidade_liberada || item.quantidade || '',
              item.produto?.nome || `Produto #${item.produto_id}`,
              this.formatarSimpas(item.produto?.codigo_simpas),
              item.produto?.codigo_barras || '',
              this.formatarLote(item.lote),
              m.observacao || ''
            ]);
          });
        } else {
          data.push([
            m.id,
            this.formatDateTime(m.data_hora || m.created_at),
            this.getTipoLabel(m.tipo),
            m.usuario?.name || '',
            m.aprovador?.name || '',
            m.setor_origem?.nome || '',
            m.setor_destino?.nome || '',
            this.getStatusSolicitacaoLabel(m.status_solicitacao),
            '',
            '',
            'Sem itens',
            '',
            '',
            '',
            m.observacao || ''
          ]);
        }
      }
      
      exportToExcel({
        data,
        columns: [
          { wch: 8 }, { wch: 18 }, { wch: 15 }, { wch: 20 },
          { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 12 },
          { wch: 12 }, { wch: 12 }, { wch: 30 }, { wch: 18 },
          { wch: 15 }, { wch: 15 }, { wch: 30 }
        ],
        filename: `relatorio_movimentacoes_${new Date().toISOString().slice(0, 10)}.xlsx`,
        sheetName: 'Movimentações',
      });
    },
    exportPdf() {
      if (!this.movimentacoes || this.movimentacoes.length === 0) return;

      const tableData = [];
      for (const m of this.movimentacoes) {
        if (m.itens && m.itens.length > 0) {
          m.itens.forEach((item, idx) => {
            tableData.push([
              idx === 0 ? m.id : '',
              idx === 0 ? this.formatDateTime(m.data_hora || m.created_at) : '',
              idx === 0 ? this.getTipoLabel(m.tipo) : '',
              idx === 0 ? (m.usuario?.name || '-') : '',
              idx === 0 ? (m.setor_origem?.nome || '-') : '',
              idx === 0 ? (m.setor_destino?.nome || '-') : '',
              idx === 0 ? this.getStatusSolicitacaoLabel(m.status_solicitacao) : '',
              item.quantidade_solicitada || item.quantidade || '',
              item.quantidade_liberada || item.quantidade || '',
              item.produto?.nome || `Produto #${item.produto_id}`,
              this.formatarSimpas(item.produto?.codigo_simpas),
              this.formatarLote(item.lote)
            ]);
          });
        } else {
          tableData.push([
            m.id,
            this.formatDateTime(m.data_hora || m.created_at),
            this.getTipoLabel(m.tipo),
            m.usuario?.name || '-',
            m.setor_origem?.nome || '-',
            m.setor_destino?.nome || '-',
            this.getStatusSolicitacaoLabel(m.status_solicitacao),
            '',
            '',
            'Sem itens',
            '',
            ''
          ]);
        }
      }

      const periodo = `Periodo: ${this.formatDate(this.filters.date_from) || 'Todos'} ate ${this.formatDate(this.filters.date_to) || 'Todos'}`;

      exportToPdf({
        title: 'Relatorio de Movimentacoes',
        subtitle: periodo,
        head: [['ID', 'Data/Hora', 'Tipo', 'Solicitante', 'Origem', 'Destino', 'Status', 'Qtd.Sol.', 'Qtd.Lib.', 'Produto', 'Cód. SIMPAS', 'Lote']],
        body: tableData,
        filename: `relatorio_movimentacoes_${new Date().toISOString().slice(0, 10)}.pdf`,
        orientation: 'landscape',
        headStyles: { fillColor: [13, 110, 253], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 28 },
          2: { cellWidth: 20 },
          3: { cellWidth: 30 },
          4: { cellWidth: 28 },
          5: { cellWidth: 28 },
          6: { cellWidth: 18 },
          7: { cellWidth: 14 },
          8: { cellWidth: 14 },
          9: { cellWidth: 40 },
          10: { cellWidth: 24 },
          11: { cellWidth: 18 }
        }
      });
    }
  }
}
</script>

<style scoped>
.movimentacao-row:hover {
  background-color: #f8f9fa;
}

.expand-icon {
  font-size: 20px;
  color: #6c757d;
  transition: transform 0.2s ease;
}

.expand-icon.expanded {
  transform: rotate(0deg);
}

.expanded-content {
  background-color: #f8f9fa;
}

.produtos-container {
  padding: 1rem;
  border-left: 3px solid #0d6efd;
  margin-left: 50px;
}

.table-sm th {
  font-size: 0.85rem;
  font-weight: 600;
  color: #495057;
  text-transform: uppercase;
}

.table-sm td {
  vertical-align: middle;
  font-size: 0.9rem;
}

.badge {
  font-size: 0.75rem;
  min-width: 40px;
  text-align: center;
}

.fw-semibold {
  font-weight: 600;
}

.material-icons {
  font-family: "Material Icons";
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  display: inline-block;
  line-height: 1;
  text-transform: none;
  letter-spacing: normal;
  word-wrap: normal;
  white-space: nowrap;
  direction: ltr;
}
</style>
