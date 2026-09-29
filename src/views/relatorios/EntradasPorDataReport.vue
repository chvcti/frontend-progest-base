<template>
  <TemplateAdmin>
    <div class="main-content">
      <div class="page-content">
        <div class="container-fluid py-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h4>Relatório de Entradas por Data</h4>
              <p class="text-muted mb-0">Entradas de estoque agrupadas por data de entrada.</p>
              <small v-if="periodo" class="text-info">
                Período: {{ formatDate(periodo.data_inicial) }} até {{ formatDate(periodo.data_final) }}
              </small>
            </div>
            <div>
              <button class="btn btn-outline-secondary me-2" @click="resetFilters">Limpar</button>
              <button class="btn btn-primary" @click="loadEntradasPorData">Atualizar</button>
            </div>
          </div>

          <div class="card mb-3">
            <div class="card-body">
              <div class="row g-2">
                <div class="col-md-2">
                  <label class="form-label">Data início</label>
                  <input type="date" v-model="filters.date_from" class="form-control" />
                </div>
                <div class="col-md-2">
                  <label class="form-label">Data fim</label>
                  <input type="date" v-model="filters.date_to" class="form-control" />
                </div>
                <div class="col-md-2">
                  <label class="form-label">Polo</label>
                  <select v-model.number="filters.polo_id" class="form-select" @change="onPoloChange">
                    <option :value="''">Todas</option>
                    <option v-for="u in unidades" :key="u.id" :value="u.id">{{ u.nome }}</option>
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
                  <button class="btn btn-outline-success me-2" @click="exportExcel" :disabled="entradasPorData.length===0">Exportar Excel</button>
                  <button class="btn btn-outline-danger" @click="exportPdf" :disabled="entradasPorData.length===0">Exportar PDF</button>
                </div>
              </div>
            </div>
          </div>

          <div v-if="loading" class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Carregando...</span>
            </div>
            <p class="mt-2 text-muted">Carregando dados...</p>
          </div>

          <div v-else>
            <div v-if="entradasPorData.length === 0" class="card">
              <div class="card-body text-center py-5 text-muted">
                <span class="material-icons" style="font-size: 48px; opacity: 0.3;">calendar_today</span>
                <p class="mt-3 mb-0">Nenhuma entrada encontrada no período</p>
              </div>
            </div>

            <!-- Cards por dia -->
            <div v-else>
              <div class="mb-3">
                <strong>Total de dias com entradas: {{ entradasPorData.length }}</strong>
              </div>

              <div v-for="dia in entradasPorData" :key="dia.data" class="card mb-3 shadow-sm">
                <!-- NÍVEL 1: Cabeçalho do Dia -->
                <div class="card-header dia-header" @click="toggleDia(dia.data)" style="cursor: pointer;">
                  <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center gap-3">
                      <span class="material-icons expand-icon" :class="{ 'expanded': isDiaExpanded(dia.data) }">
                        {{ isDiaExpanded(dia.data) ? 'expand_more' : 'chevron_right' }}
                      </span>
                      <div>
                        <h5 class="mb-0">
                          <span class="material-icons align-middle me-2" style="font-size: 20px;">event</span>
                          {{ formatDateExtended(dia.data) }}
                        </h5>
                      </div>
                    </div>
                    <div class="d-flex gap-3">
                      <span class="badge bg-primary fs-6">
                        {{ dia.total_produtos }} {{ dia.total_produtos === 1 ? 'produto' : 'produtos' }}
                      </span>
                      <span class="badge bg-success fs-6">
                        Total: {{ dia.quantidade_total_dia }} unidades
                      </span>
                    </div>
                  </div>
                </div>

                <!-- NÍVEL 2: Produtos do dia (expansível) -->
                <div v-show="isDiaExpanded(dia.data)" class="card-body p-0">
                  <div v-for="(produtoItem, pIdx) in dia.produtos" :key="`${dia.data}-${produtoItem.produto.id}`" 
                       class="produto-container" :class="{ 'border-top': pIdx > 0 }">
                    
                    <!-- Header do Produto -->
                    <div class="produto-header" @click="toggleProduto(dia.data, produtoItem.produto.id)" style="cursor: pointer;">
                      <div class="d-flex align-items-center justify-content-between">
                        <div class="d-flex align-items-center gap-2">
                          <span class="material-icons expand-icon-small" :class="{ 'expanded': isProdutoExpanded(dia.data, produtoItem.produto.id) }">
                            {{ isProdutoExpanded(dia.data, produtoItem.produto.id) ? 'expand_more' : 'chevron_right' }}
                          </span>
                          <div>
                            <strong class="produto-nome">{{ produtoItem.produto.nome }}</strong>
                            <div class="produto-meta">
                              <span v-if="produtoItem.produto.codigo_simpas" class="me-3">
                                <span class="material-icons align-middle" style="font-size: 14px;">barcode</span>
                                {{ produtoItem.produto.codigo_simpas }}
                              </span>
                              <span v-if="produtoItem.produto.codigo_barras" class="me-3">
                                <span class="material-icons align-middle" style="font-size: 14px;">qr_code</span>
                                {{ produtoItem.produto.codigo_barras }}
                              </span>
                              <span class="me-3">
                                <span class="material-icons align-middle" style="font-size: 14px;">straighten</span>
                                {{ produtoItem.produto.unidade_medida }}
                              </span>
                              <span class="badge bg-light text-dark">{{ produtoItem.produto.grupo_produto }}</span>
                            </div>
                          </div>
                        </div>
                        <div class="d-flex gap-2">
                          <span class="badge bg-info">
                            {{ produtoItem.quantidade_total }} {{ produtoItem.produto.unidade_medida }}
                          </span>
                          <span class="badge bg-secondary">
                            {{ produtoItem.total_entradas }} {{ produtoItem.total_entradas === 1 ? 'entrada' : 'entradas' }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- NÍVEL 3: Entradas do produto (expansível) -->
                    <div v-show="isProdutoExpanded(dia.data, produtoItem.produto.id)" class="entradas-list">
                      <div v-if="!produtoItem.entradas || produtoItem.entradas.length === 0" class="text-center text-muted py-3">
                        Nenhuma entrada detalhada
                      </div>
                      <div v-else class="table-responsive">
                        <table class="table table-sm table-hover mb-0">
                          <thead class="table-light">
                            <tr>
                              <th style="width: 80px;">ID</th>
                              <th style="width: 100px;">Quantidade</th>
                              <th style="width: 110px;">Valor Unit.</th>
                              <th>Nota Fiscal</th>
                              <th>Fornecedor</th>
                              <th>Lote</th>
                              <th style="width: 120px;">Fabricação</th>
                              <th style="width: 120px;">Vencimento</th>
                              <th style="width: 150px;">Data/Hora</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="entrada in produtoItem.entradas" :key="entrada.entrada_id">
                              <td class="text-muted">#{{ entrada.entrada_id }}</td>
                              <td>
                                <span class="badge bg-success text-white">{{ entrada.quantidade }}</span>
                              </td>
                              <td class="text-muted small">
                                <span v-if="entrada.valor_unitario != null" class="text-success fw-semibold">
                                  R$ {{ parseFloat(entrada.valor_unitario).toFixed(2) }}
                                </span>
                                <span v-else class="text-muted">-</span>
                              </td>
                              <td>{{ entrada.nota_fiscal || '-' }}</td>
                              <td>
                                <span class="material-icons align-middle text-primary" style="font-size: 16px;">business</span>
                                {{ entrada.fornecedor?.razao_social_nome || entrada.fornecedor?.razao_social || entrada.fornecedor?.nome || '-' }}
                              </td>
                              <td class="text-muted small">{{ entrada.lote || '-' }}</td>
                              <td class="text-muted small">{{ formatDate(entrada.data_fabricacao) }}</td>
                              <td class="text-muted small">{{ formatDate(entrada.data_vencimento) }}</td>
                              <td class="text-muted small">{{ formatDateTime(entrada.data_hora) }}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
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
  name: 'EntradasPorDataReport',
  components: { TemplateAdmin },
  data() {
    const hoje = this.getTodayDate();
    return {
      filters: {
        date_from: hoje,
        date_to: hoje,
        polo_id: '',
        setor_id: '',
      },
      entradasPorData: [],
      periodo: null,
      loading: false,
      expandedDias: {}, // Controla quais dias estão expandidos
      expandedProdutos: {}, // Controla quais produtos estão expandidos (formato: 'data-produtoId')
    }
  },
  mounted() {
    functionsPolos.listAll(this);
    functionsSetores.listAll(this);
    this.loadEntradasPorData();
  },
  computed: {
    unidades() {
      return this.$store.state.cadastros.listPolos || [];
    },
    setores() {
      const setoresData = this.$store.state.cadastros.listSetoresGerais;
      if (Array.isArray(setoresData)) return setoresData;
      if (setoresData?.data) return setoresData.data;
      return [];
    },
    setoresFiltrados() {
      if (!this.filters.polo_id) return this.setores;
      return this.setores.filter(s => s.polo_id == this.filters.polo_id);
    }
  },
  methods: {
    onPoloChange() {
      this.filters.setor_id = '';
    },
    getTodayDate() {
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const dia = String(hoje.getDate()).padStart(2, '0');
      return `${ano}-${mes}-${dia}`;
    },
    toggleDia(data) {
      this.expandedDias[data] = !this.expandedDias[data];
    },
    isDiaExpanded(data) {
      return this.expandedDias[data] || false;
    },
    toggleProduto(data, produtoId) {
      const key = `${data}-${produtoId}`;
      this.expandedProdutos[key] = !this.expandedProdutos[key];
    },
    isProdutoExpanded(data, produtoId) {
      const key = `${data}-${produtoId}`;
      return this.expandedProdutos[key] || false;
    },
    async loadEntradasPorData() {
      this.loading = true;
      try {
        const payloadFilters = {};
        if (this.filters.date_from) payloadFilters.date_from = this.filters.date_from;
        if (this.filters.date_to) payloadFilters.date_to = this.filters.date_to;
        if (this.filters.polo_id) payloadFilters.polo_id = this.filters.polo_id;
        if (this.filters.setor_id) payloadFilters.setor_id = this.filters.setor_id;

        const result = await functionsRelatorios.listEntradasPorDataReport(this, payloadFilters);
        if (result && result.success) {
          this.entradasPorData = result.data || [];
          this.periodo = result.periodo || null;
          
          // Expandir todos os dias por padrão
          this.expandedDias = {};
          this.expandedProdutos = {};
          this.entradasPorData.forEach(dia => {
            this.expandedDias[dia.data] = true;
            // Expandir todos os produtos também
            if (dia.produtos) {
              dia.produtos.forEach(produtoItem => {
                const key = `${dia.data}-${produtoItem.produto.id}`;
                this.expandedProdutos[key] = true;
              });
            }
          });
        } else {
          this.entradasPorData = [];
          this.periodo = null;
        }
      } catch (e) {
        console.error('Erro ao carregar relatório de entradas por data:', e);
        this.entradasPorData = [];
        this.periodo = null;
      } finally {
        this.loading = false;
      }
    },
    resetFilters() {
      const hoje = this.getTodayDate();
      this.filters.date_from = hoje;
      this.filters.date_to = hoje;
      this.filters.polo_id = '';
      this.filters.setor_id = '';
      this.loadEntradasPorData();
    },
    formatDate(d) {
      if (!d) return '-';
      const str = String(d).split('T')[0];
      const parts = str.split('-');
      if (parts.length < 3) return d;
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    },
    formatDateExtended(d) {
      if (!d) return '-';
      const date = new Date(d + 'T00:00:00');
      const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      
      const diaSemana = diasSemana[date.getDay()];
      const dia = date.getDate();
      const mes = meses[date.getMonth()];
      const ano = date.getFullYear();
      
      return `${diaSemana}, ${dia} de ${mes} de ${ano}`;
    },
    formatDateTime(dt) {
      if (!dt) return '-';
      const parts = dt.split(' ');
      if (parts.length === 2) {
        const dateParts = parts[0].split('-');
        const timeParts = parts[1].split(':');
        if (dateParts.length === 3 && timeParts.length >= 2) {
          return `${dateParts[2]}/${dateParts[1]}/${dateParts[0]} ${timeParts[0]}:${timeParts[1]}`;
        }
      }
      return dt;
    },
    exportExcel() {
      if (!this.entradasPorData || this.entradasPorData.length === 0) return;
      
      // Preparar dados para o Excel
      const data = [];
      
      // Cabeçalho
      data.push(['Data', 'Total Produtos Dia', 'Qtd Total Dia', 'Produto', 'Cód.simpas', 'Cód.Barras', 'Unid.Medida', 'Grupo', 'Qtd Produto', 'ID Entrada', 'Qtd Entrada', 'Valor Unit. (R$)', 'Nota Fiscal', 'Fornecedor', 'Lote', 'Fabricação', 'Vencimento', 'Data/Hora']);
      
      // Dados com estrutura hierárquica achatada
      for (const dia of this.entradasPorData) {
        for (const produtoItem of dia.produtos || []) {
          if (produtoItem.entradas && produtoItem.entradas.length > 0) {
            produtoItem.entradas.forEach((entrada, entIdx) => {
              data.push([
                entIdx === 0 ? this.formatDate(dia.data) : '',
                entIdx === 0 ? dia.total_produtos : '',
                entIdx === 0 ? dia.quantidade_total_dia : '',
                entIdx === 0 ? produtoItem.produto.nome : '',
                entIdx === 0 ? (produtoItem.produto.codigo_simpas || '') : '',
                entIdx === 0 ? (produtoItem.produto.codigo_barras || '') : '',
                entIdx === 0 ? produtoItem.produto.unidade_medida : '',
                entIdx === 0 ? produtoItem.produto.grupo_produto : '',
                entIdx === 0 ? produtoItem.quantidade_total : '',
                entrada.entrada_id || '',
                entrada.quantidade || '',
                entrada.valor_unitario != null ? parseFloat(entrada.valor_unitario).toFixed(2) : '',
                entrada.nota_fiscal || '',
                entrada.fornecedor?.razao_social_nome || entrada.fornecedor?.razao_social || entrada.fornecedor?.nome || '',
                entrada.lote || '',
                this.formatDate(entrada.data_fabricacao),
                this.formatDate(entrada.data_vencimento),
                this.formatDateTime(entrada.data_hora)
              ]);
            });
          } else {
            data.push([
              this.formatDate(dia.data),
              dia.total_produtos,
              dia.quantidade_total_dia,
              produtoItem.produto.nome,
              produtoItem.produto.codigo_simpas || '',
              produtoItem.produto.codigo_barras || '',
              produtoItem.produto.unidade_medida,
              produtoItem.produto.grupo_produto,
              produtoItem.quantidade_total,
              'Sem entradas',
              '',
              '',
              '',
              '',
              '',
              '',
              ''
            ]);
          }
        }
      }
      
      exportToExcel({
        data,
        columns: [
          { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 35 }, { wch: 15 },
          { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 10 },
          { wch: 10 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 12 },
          { wch: 12 }, { wch: 18 }
        ],
        filename: `relatorio_entradas_por_data_${new Date().toISOString().slice(0, 10)}.xlsx`,
        sheetName: 'Entradas por Data',
      });
    },
    exportPdf() {
      if (!this.entradasPorData || this.entradasPorData.length === 0) return;

      const tableData = [];
      for (const dia of this.entradasPorData) {
        for (const produtoItem of dia.produtos || []) {
          if (produtoItem.entradas && produtoItem.entradas.length > 0) {
            produtoItem.entradas.forEach((entrada, entIdx) => {
              tableData.push([
                entIdx === 0 ? this.formatDate(dia.data) : '',
                entIdx === 0 ? dia.quantidade_total_dia : '',
                entIdx === 0 ? produtoItem.produto.nome : '',
                entIdx === 0 ? (produtoItem.produto.codigo_simpas || '') : '',
                entIdx === 0 ? produtoItem.quantidade_total : '',
                entrada.entrada_id || '',
                entrada.quantidade || '',
                entrada.nota_fiscal || '-',
                entrada.fornecedor?.razao_social_nome || entrada.fornecedor?.razao_social || entrada.fornecedor?.nome || '-',
                this.formatDateTime(entrada.data_hora)
              ]);
            });
          } else {
            tableData.push([
              this.formatDate(dia.data),
              dia.quantidade_total_dia,
              produtoItem.produto.nome,
              produtoItem.produto.codigo_simpas || '',
              produtoItem.quantidade_total,
              'Sem ent.',
              '',
              '',
              '',
              ''
            ]);
          }
        }
      }

      exportToPdf({
        title: 'Relatorio de Entradas por Data',
        subtitle: this.periodo
          ? `Periodo: ${this.formatDate(this.periodo.data_inicial)} ate ${this.formatDate(this.periodo.data_final)}`
          : null,
        head: [['Data', 'Qtd Dia', 'Produto', 'Cod. SIMPAS', 'Qtd Prod', 'ID Ent', 'Qtd', 'NF', 'Fornecedor', 'Data/Hora']],
        body: tableData,
        filename: `relatorio_entradas_por_data_${new Date().toISOString().slice(0, 10)}.pdf`,
        orientation: 'landscape',
        headStyles: { fillColor: [40, 167, 69], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 18 },
          2: { cellWidth: 50 },
          3: { cellWidth: 25 },
          4: { cellWidth: 18 },
          5: { cellWidth: 15 },
          6: { cellWidth: 15 },
          7: { cellWidth: 20 },
          8: { cellWidth: 40 },
          9: { cellWidth: 30 }
        }
      });
    }
  }
}
</script>

<style scoped>
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

/* Cabeçalho do dia */
.dia-header {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  padding: 1rem 1.25rem;
  border: none;
  transition: all 0.3s ease;
}

.dia-header:hover {
  background: linear-gradient(135deg, #218838 0%, #1aa179 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.dia-header h5 {
  color: white;
  font-weight: 600;
}

/* Ícones de expansão */
.expand-icon {
  transition: transform 0.3s ease;
  font-size: 24px;
  color: white;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.expand-icon-small {
  transition: transform 0.3s ease;
  font-size: 20px;
  color: #28a745;
}

.expand-icon-small.expanded {
  transform: rotate(90deg);
}

/* Container de produtos */
.produto-container {
  background-color: #f8f9fa;
}

.produto-header {
  padding: 1rem 1.25rem;
  transition: background-color 0.2s ease;
}

.produto-header:hover {
  background-color: #e9ecef;
}

.produto-nome {
  font-size: 1.05rem;
  color: #2c3e50;
}

.produto-meta {
  font-size: 0.85rem;
  color: #6c757d;
  margin-top: 0.25rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
}

/* Lista de entradas */
.entradas-list {
  background-color: #ffffff;
  border-top: 2px solid #dee2e6;
}

.entradas-list .table {
  margin-bottom: 0;
}

.entradas-list thead {
  background-color: #f1f3f5;
}

.entradas-list tbody tr:hover {
  background-color: #f8f9fa;
}

/* Badges customizados */
.badge {
  font-weight: 500;
  padding: 0.35em 0.65em;
}

/* Animações suaves */
.card {
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1) !important;
}

/* Spinner de loading */
.spinner-border {
  width: 3rem;
  height: 3rem;
}

/* Tabela responsiva */
.table-responsive {
  border-radius: 0;
}

/* Cores dos ícones */
.text-primary {
  color: #0d6efd !important;
}

.text-success {
  color: #28a745 !important;
}

/* Espaçamento */
.gap-2 {
  gap: 0.5rem !important;
}

.gap-3 {
  gap: 1rem !important;
}

/* Cards sem dados */
.card-body.py-5 {
  padding-top: 3rem !important;
  padding-bottom: 3rem !important;
}
</style>
