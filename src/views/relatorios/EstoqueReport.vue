<template>
  <TemplateAdmin>
    <div class="main-content">
      <div class="page-content">
        <div class="container-fluid py-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h4>Relatório de Estoque Atual</h4>
              <p class="text-muted mb-0">Situação atual do estoque por produto e setor.</p>
            </div>
            <div>
              <button class="btn btn-outline-secondary me-2" @click="resetFilters">Limpar</button>
              <button class="btn btn-primary" @click="loadEstoque(true)">Atualizar</button>
            </div>
          </div>

          <!-- Indicação visual do setor cujo estoque está sendo exibido -->
          <div class="setor-banner mb-3">
            <span class="material-icons setor-banner-icon">apartment</span>
            <div class="setor-banner-info">
              <span class="setor-banner-label">Estoque exibido</span>
              <span class="setor-banner-nome">{{ setorSelecionadoNome }}</span>
              <span v-if="setorSelecionadoPolo" class="setor-banner-polo">{{ setorSelecionadoPolo }}</span>
            </div>
            <div class="setor-banner-actions">
              <span v-if="filtrandoSetorLogado" class="badge bg-primary">Seu setor</span>
              <span v-else-if="filters.setor_id" class="badge bg-warning text-dark">Outro setor</span>
              <span v-else class="badge bg-secondary">Vários setores</span>
              <button
                v-if="podeFiltrarSetor && setorAtualId && !filtrandoSetorLogado"
                class="btn btn-sm btn-outline-primary"
                @click="voltarParaSetorLogado"
              >
                Voltar ao meu setor
              </button>
            </div>
          </div>

          <div class="card mb-3">
            <div class="card-body">
              <div class="row g-2">
                <div class="col-md-3">
                  <label class="form-label">Polo</label>
                  <select
                    v-model.number="filters.polo_id"
                    class="form-select"
                    :disabled="!podeFiltrarSetor"
                    @change="onPoloChange"
                  >
                    <option :value="''">Todas</option>
                    <option v-for="p in polos" :key="p.id" :value="p.id">{{ p.nome }}</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Setor</label>
                  <select v-model.number="filters.setor_id" class="form-select" :disabled="!podeFiltrarSetor" @change="currentPage = 1">
                    <option v-if="podeFiltrarSetor" :value="''">Todos</option>
                    <option v-for="s in setoresFiltrados" :key="s.id" :value="s.id">{{ s.nome }}</option>
                  </select>
                  <small v-if="!podeFiltrarSetor" class="form-text text-muted">
                    Apenas administradores podem consultar outros setores.
                  </small>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Grupo de Produto</label>
                  <select v-model.number="filters.grupo_produto_id" class="form-select" @change="currentPage = 1">
                    <option :value="''">Todos</option>
                    <option v-for="g in gruposProdutos" :key="g.id" :value="g.id">{{ g.nome }}</option>
                  </select>
                </div>
                <div class="col-md-3 d-flex align-items-end justify-content-end">
                  <button class="btn btn-outline-success me-2" @click="exportExcel" :disabled="estoque.length===0">Exportar Excel</button>
                  <button class="btn btn-outline-danger" @click="exportPdf" :disabled="estoque.length===0">Exportar PDF</button>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-body">
              <div v-if="loading" class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Carregando...</span>
                </div>
                <p class="mt-2 text-muted">Carregando dados...</p>
              </div>
              <div v-else>
                <div class="mb-3 d-flex flex-wrap gap-3 align-items-center">
                  <span class="badge bg-primary fs-6">
                    Total: {{ totalRecords }} itens
                  </span>
                  <span v-if="totalizadores.total_produtos_disponiveis" class="badge bg-success fs-6">
                    Disponíveis: {{ totalizadores.total_produtos_disponiveis }}
                  </span>
                  <span v-if="totalizadores.total_produtos_indisponiveis" class="badge bg-secondary fs-6">
                    Indisponíveis: {{ totalizadores.total_produtos_indisponiveis }}
                  </span>
                  <span v-if="totalizadores.total_abaixo_minimo" class="badge bg-warning text-dark fs-6">
                    Abaixo do mínimo: {{ totalizadores.total_abaixo_minimo }}
                  </span>
                  <span v-if="hasValoresFinanceiros && totalizadores.valor_total_estoque" class="badge fs-6" style="background-color: #4f46e5; color: white;">
                    Patrimônio CAF: {{ formatCurrency(totalizadores.valor_total_estoque) }}
                  </span>
                </div>
                <div class="table-responsive">
                  <table class="table table-hover">
                    <thead class="table-light">
                      <tr>
                        <th style="width: 50px;"></th>
                        <th>Produto</th>
                        <th style="width: 140px;">Cód. SIMPAS</th>
                        <th style="width: 120px;">Cód. Barras</th>
                        <th style="width: 100px;">Unid. Medida</th>
                        <th>Grupo</th>
                        <th style="width: 120px;">Localização</th>
                        <th style="width: 120px;" class="text-end">Quantidade</th>
                        <th style="width: 100px;" class="text-end">Mínimo</th>
                        <th v-if="hasValoresFinanceiros" style="width: 130px;" class="text-end">Valor Total (R$)</th>
                        <th style="width: 100px;">Status</th>
                        <th style="width: 250px;">Setor / Polo</th>
                      </tr>
                    </thead>
                    <tbody>
                      <template v-for="item in estoque" :key="item.id">
                        <!-- Linha principal do item -->
                        <tr class="estoque-row" @click="toggleRow(item.id)" style="cursor: pointer;">
                          <td>
                            <span class="material-icons expand-icon" :class="{ 'expanded': expandedRows[item.id] }">
                              {{ expandedRows[item.id] ? 'expand_more' : 'chevron_right' }}
                            </span>
                          </td>
                          <td>
                            <strong>{{ item.produto?.nome || '-' }}</strong>
                            <span
                              v-if="isControlado(item)"
                              class="badge controlado-badge ms-2"
                              title="Medicamento controlado — Portaria SVS/MS 344/98"
                            >
                              Controlado{{ item.produto?.lista_portaria ? ' · ' + item.produto.lista_portaria : '' }}
                            </span>
                          </td>
                          <td>{{ formatarSimpas(item.produto?.codigo_simpas) }}</td>
                          <td>{{ item.produto?.codigo_barras || '-' }}</td>
                          <td>{{ getUnidade(item) }}</td>
                          <td>
                            <span class="badge bg-light text-dark">
                              {{ getGrupo(item) }}
                            </span>
                          </td>
                          <td>{{ item.localizacao || '-' }}</td>
                          <td class="text-end">
                            <span class="badge" :class="getQuantidadeBadgeClass(item.quantidade_atual, item.quantidade_minima)">
                              {{ item.quantidade_atual || 0 }}
                            </span>
                          </td>
                          <td class="text-end text-muted">
                            {{ item.quantidade_minima || 0 }}
                          </td>
                          <td v-if="hasValoresFinanceiros" class="text-end font-semibold text-dark">
                            {{ formatCurrency(item.valor_total) }}
                          </td>
                          <td>
                            <span class="badge" :class="getStatusDisponibilidadeBadgeClass(item.status_disponibilidade)">
                              {{ getStatusDisponibilidadeText(item.status_disponibilidade) }}
                            </span>
                            <span v-if="item.abaixo_minimo" class="badge bg-warning text-dark ms-1" title="Estoque abaixo do mínimo">
                              <span class="material-icons" style="font-size: 14px;">warning</span>
                            </span>
                          </td>
                          <td>
                            <div>{{ getSetorCompleto(item.setor) }}</div>
                          </td>
                        </tr>
                        
                        <!-- Linha expansível com lotes -->
                        <tr v-if="expandedRows[item.id]" class="expanded-content">
                          <td :colspan="hasValoresFinanceiros ? 12 : 11" class="p-0">
                            <div class="lotes-container">
                              <div class="d-flex justify-content-between align-items-center mb-3">
                                <h6 class="mb-0">Lotes do Produto</h6>
                                <div class="d-flex gap-2">
                                  <span v-if="item.lotes_info?.total_lotes" class="badge bg-info">
                                    {{ item.lotes_info.total_lotes }} {{ item.lotes_info.total_lotes === 1 ? 'lote' : 'lotes' }}
                                  </span>
                                  <span v-if="item.lotes_info?.quantidade_total_lotes" class="badge bg-success">
                                    Total: {{ item.lotes_info.quantidade_total_lotes }} unidades
                                  </span>
                                </div>
                              </div>
                              
                              <!-- Alerta de lote próximo ao vencimento -->
                              <div v-if="item.lotes_info?.lote_proximo_vencimento" class="alert alert-warning py-2 mb-3">
                                <div class="d-flex align-items-center gap-2">
                                  <span class="material-icons" style="font-size: 20px;">warning</span>
                                  <div>
                                    <strong>Lote próximo ao vencimento:</strong> 
                                    {{ item.lotes_info.lote_proximo_vencimento.lote }} - 
                                    {{ item.lotes_info.lote_proximo_vencimento.quantidade }} unidades - 
                                    Vence em {{ item.lotes_info.lote_proximo_vencimento.dias_para_vencer }} dias
                                    ({{ formatDate(item.lotes_info.lote_proximo_vencimento.data_vencimento) }})
                                  </div>
                                </div>
                              </div>

                              <div v-if="!item.lotes_info?.lotes || item.lotes_info.lotes.length === 0" class="text-center text-muted py-3">
                                Nenhum lote encontrado
                              </div>
                              <table v-else class="table table-sm mb-0">
                                <thead class="table-light">
                                  <tr>
                                    <th style="width: 140px;">Lote</th>
                                    <th style="width: 110px;">Quantidade</th>
                                    <th v-if="hasValoresFinanceiros" style="width: 120px;" class="text-end">Valor Unit.</th>
                                    <th v-if="hasValoresFinanceiros" style="width: 130px;" class="text-end">Subtotal Lote</th>
                                    <th style="width: 130px;">Data Fabricação</th>
                                    <th style="width: 130px;">Data Vencimento</th>
                                    <th style="width: 110px;">Dias p/ Vencer</th>
                                    <th>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr v-for="(lote, idx) in item.lotes_info.lotes" :key="lote.id || idx" :class="{ 'table-danger': lote.vencido, 'table-warning': !lote.vencido && lote.dias_para_vencer <= 30 }">
                                    <td class="fw-semibold">{{ lote.lote || '-' }}</td>
                                    <td>
                                      <span class="badge bg-info">{{ lote.quantidade_disponivel }}</span>
                                    </td>
                                    <td v-if="hasValoresFinanceiros" class="text-end text-muted font-semibold">
                                      {{ formatCurrency(lote.valor_unitario) }}
                                    </td>
                                    <td v-if="hasValoresFinanceiros" class="text-end font-bold text-dark">
                                      {{ formatCurrency(lote.valor_total_lote) }}
                                    </td>
                                    <td class="text-muted small">{{ formatDate(lote.data_fabricacao) }}</td>
                                    <td class="text-muted small">{{ formatDate(lote.data_vencimento) }}</td>
                                    <td class="text-center">
                                      <span v-if="lote.vencido" class="badge bg-danger">Vencido</span>
                                      <span v-else-if="lote.dias_para_vencer <= 30" class="badge bg-warning text-dark">{{ lote.dias_para_vencer }} dias</span>
                                      <span v-else class="text-muted">{{ lote.dias_para_vencer }} dias</span>
                                    </td>
                                    <td>
                                      <span class="badge" :class="getLoteStatusBadgeClass(lote.vencido, lote.dias_para_vencer)">
                                        {{ getLoteStatusText(lote.vencido, lote.dias_para_vencer) }}
                                      </span>
                                    </td>
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

                <!-- Paginação -->
                <div v-if="lastPage > 1" class="d-flex justify-content-end mt-3">
                  <nav aria-label="Navegação de páginas">
                    <ul class="pagination pagination-sm mb-0">
                      <li class="page-item" :class="{ disabled: currentPage === 1 }">
                        <button class="page-link" @click="changePage(currentPage - 1)" :disabled="currentPage === 1">Anterior</button>
                      </li>
                      <li class="page-item disabled">
                        <span class="page-link">Página {{ currentPage }} de {{ lastPage }}</span>
                      </li>
                      <li class="page-item" :class="{ disabled: currentPage === lastPage }">
                        <button class="page-link" @click="changePage(currentPage + 1)" :disabled="currentPage === lastPage">Próximo</button>
                      </li>
                    </ul>
                  </nav>
                </div>

                <div v-if="estoque.length===0" class="text-center py-5 text-muted">
                  <span class="material-icons" style="font-size: 48px; opacity: 0.3;">inventory_2</span>
                  <p class="mt-3 mb-0">Nenhum item em estoque encontrado</p>
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
import functionsGrupoProduto from '@/functions/cad_grupo_produto.js'
import { exportToExcel, exportToPdf } from '@/utils/exportUtils'

export default {
  name: 'EstoqueReport',
  components: { TemplateAdmin },
  data() {
    return {
      filters: {
        polo_id: '',
        setor_id: '',
        grupo_produto_id: '',
      },
      estoque: [],
      currentPage: 1,
      lastPage: 1,
      totalRecords: 0,
      totalizadores: {
        total_itens: 0,
        total_produtos_disponiveis: 0,
        total_produtos_indisponiveis: 0,
        total_abaixo_minimo: 0,
        valor_total_estoque: 0
      },
      loading: false,
      expandedRows: {}, // Controla quais linhas estão expandidas
    }
  },
  mounted() {
    functionsPolos.listAll(this);
    functionsSetores.listAll(this);
    functionsGrupoProduto.listAll(this);
    this.applyDefaultSetorFilter();
    this.loadEstoque();
  },
  watch: {
    /**
     * O setor logado pode ser carregado no store depois da montagem
     * (ex.: refresh direto na rota). Ao aparecer, reaplica o filtro padrão.
     */
    setorAtualId(novo, antigo) {
      if (!novo || novo === antigo) return;
      if (!this.filters.setor_id || Number(this.filters.setor_id) === Number(antigo)) {
        this.applyDefaultSetorFilter();
        this.loadEstoque();
      }
    },
  },
  computed: {
    /** Setor em que o usuário está logado (cookie/store) */
    setorAtualId() {
      const id = this.$store.state.estoque.setorAtualId || this.$store.state.estoque.setorDetails?.id;
      return id ? Number(id) : '';
    },
    setorAtualDetalhes() {
      return this.$store.state.estoque.setorDetails || null;
    },
    listUsuariosSetor() {
      return this.$store.state.estoque.listUsuariosSetor || [];
    },
    /** Perfil 'admin' no setor atual (mesma lógica do Sidebar/Relatórios) */
    isAdmin() {
      if (this.$store.getters["auth/isSuperAdmin"]) return true;

      const user = this.$store.state.auth.user;
      if (!user) return false;
      return this.listUsuariosSetor.some((u) => {
        const uid = u.usuario_id || u.user_id || u.id || (u.usuario && u.usuario.id);
        const perfil = (u.perfil || (u.pivot && u.pivot.perfil) || '').toString().toLowerCase();
        return uid === user.id && perfil === 'admin';
      });
    },
    isAdminPolo() {
      return !!this.$store.state.auth.user?.is_admin_polo;
    },
    /** Somente admin (setor, polo ou super) filtra o estoque de outros setores */
    podeFiltrarSetor() {
      return this.isAdmin || this.isAdminPolo;
    },
    filtrandoSetorLogado() {
      return !!this.setorAtualId && Number(this.filters.setor_id) === this.setorAtualId;
    },
    setorSelecionado() {
      if (!this.filters.setor_id) return null;
      return this.setores.find(s => Number(s.id) === Number(this.filters.setor_id)) || null;
    },
    /** Texto exibido no banner e no cabeçalho do PDF */
    setorSelecionadoNome() {
      if (!this.filters.setor_id) {
        const polo = this.polos.find(p => Number(p.id) === Number(this.filters.polo_id));
        return polo ? `Todos os setores do polo ${polo.nome}` : 'Todos os setores disponíveis';
      }
      const setor = this.setorSelecionado;
      if (setor) return setor.nome_exibicao || setor.nome;
      if (this.filtrandoSetorLogado) {
        return this.setorAtualDetalhes?.nome_exibicao
          || this.setorAtualDetalhes?.nome
          || this.$store.state.estoque.setorAtualNome
          || 'Setor atual';
      }
      return 'Setor selecionado';
    },
    setorSelecionadoPolo() {
      if (!this.filters.setor_id) return '';
      const setor = this.setorSelecionado;
      const poloDoSetor = setor?.polo?.nome
        || this.polos.find(p => Number(p.id) === Number(setor?.polo_id))?.nome;
      if (poloDoSetor) return poloDoSetor;
      if (this.filtrandoSetorLogado) return this.setorAtualDetalhes?.polo?.nome || '';
      return '';
    },
    polos() {
      return this.$store.state.cadastros.listPolos || [];
    },
    setores() {
      const setoresData = this.$store.state.cadastros.listSetoresGerais;
      if (Array.isArray(setoresData)) return setoresData;
      if (setoresData?.data) return setoresData.data;
      return [];
    },
    setoresFiltrados() {
      // Usuário sem perfil de admin enxerga somente o próprio setor
      if (!this.podeFiltrarSetor) {
        if (!this.setorAtualId) return [];
        const doStore = this.setores.find(s => Number(s.id) === this.setorAtualId);
        if (doStore) return [doStore];
        return [{
          id: this.setorAtualId,
          nome: this.setorAtualDetalhes?.nome_exibicao
            || this.setorAtualDetalhes?.nome
            || this.$store.state.estoque.setorAtualNome
            || 'Meu setor',
        }];
      }
      if (!this.filters.polo_id) return this.setores;
      return this.setores.filter(s => s.polo_id == this.filters.polo_id);
    },
    hasValoresFinanceiros() {
      return Array.isArray(this.estoque) && this.estoque.some(e => e.pode_ver_valores === true);
    },
    gruposProdutos() {
      return this.$store.state.cadastros.listGrupoProdutos || [];
    }
  },
  methods: {
    /** Filtro padrão do relatório: o setor em que o usuário está logado */
    applyDefaultSetorFilter() {
      if (!this.setorAtualId) return;
      this.filters.setor_id = this.setorAtualId;
      const poloId = this.setorAtualDetalhes?.polo_id || this.setorAtualDetalhes?.polo?.id;
      this.filters.polo_id = poloId ? Number(poloId) : '';
    },
    voltarParaSetorLogado() {
      this.applyDefaultSetorFilter();
      this.loadEstoque(true);
    },
    onPoloChange() {
      this.filters.setor_id = '';
      this.currentPage = 1;
    },
    toggleRow(itemId) {
      this.expandedRows[itemId] = !this.expandedRows[itemId];
    },
    async loadEstoque(resetPage = false) {
      if (resetPage === true) {
        this.currentPage = 1;
      }
      // Não-admin fica restrito ao estoque do setor logado
      if (!this.podeFiltrarSetor && this.setorAtualId) {
        this.filters.setor_id = this.setorAtualId;
      }

      this.loading = true;
      try {
        const payloadFilters = { page: this.currentPage };
        if (this.filters.polo_id) payloadFilters.polo_id = this.filters.polo_id;
        if (this.filters.setor_id) payloadFilters.setor_id = this.filters.setor_id;
        if (this.filters.grupo_produto_id) payloadFilters.grupo_produto_id = this.filters.grupo_produto_id;

        const result = await functionsRelatorios.listEstoqueReport(this, payloadFilters);
        if (result && result.success) {
          this.estoque = result.data?.data || [];
          this.currentPage = result.data?.current_page || 1;
          this.lastPage = result.data?.last_page || 1;
          this.totalRecords = result.data?.total || 0;
          
          // Capturar totalizadores da resposta
          if (result.totalizadores) {
            this.totalizadores = result.totalizadores;
          }
          
          // Expandir todas as linhas por padrão
          this.expandedRows = {};
          this.estoque.forEach(item => {
            this.expandedRows[item.id] = true;
          });
        } else {
          this.estoque = [];
          this.currentPage = 1;
          this.lastPage = 1;
          this.totalRecords = 0;
          this.totalizadores = {
            total_itens: 0,
            total_produtos_disponiveis: 0,
            total_produtos_indisponiveis: 0,
            total_abaixo_minimo: 0,
            valor_total_estoque: 0
          };
        }
      } catch (e) {
        console.error('Erro ao carregar relatório de estoque:', e);
        this.estoque = [];
        this.currentPage = 1;
        this.lastPage = 1;
        this.totalRecords = 0;
        this.totalizadores = {
          total_itens: 0,
          total_produtos_disponiveis: 0,
          total_produtos_indisponiveis: 0,
          total_abaixo_minimo: 0
        };
      } finally {
        this.loading = false;
      }
    },
    changePage(page) {
      if (page >= 1 && page <= this.lastPage) {
        this.currentPage = page;
        this.loadEstoque();
      }
    },
    resetFilters() {
      this.filters.polo_id = '';
      this.filters.setor_id = '';
      this.filters.grupo_produto_id = '';
      this.currentPage = 1;
      this.applyDefaultSetorFilter();
      this.loadEstoque();
    },
    formatDate(d) {
      if (!d) return '-';
      const str = String(d).split('T')[0];
      const parts = str.split('-');
      if (parts.length < 3) return d;
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    },
    formatCurrency(val) {
      if (val === null || val === undefined || isNaN(val)) return '-';
      return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    },
    getStatusDisponibilidadeText(status) {
      const statusMap = {
        'D': 'Disponível',
        'I': 'Indisponível',
        'R': 'Reservado',
        'B': 'Bloqueado'
      };
      return statusMap[status] || status || '-';
    },
    getStatusDisponibilidadeBadgeClass(status) {
      const classMap = {
        'D': 'bg-success',
        'I': 'bg-secondary',
        'R': 'bg-warning text-dark',
        'B': 'bg-danger'
      };
      return classMap[status] || 'bg-secondary';
    },
    getQuantidadeBadgeClass(quantidade, minimo) {
      const qtd = parseFloat(quantidade) || 0;
      const min = parseFloat(minimo) || 0;
      
      if (qtd === 0) return 'bg-secondary';
      if (qtd <= min) return 'bg-danger';
      if (qtd <= min * 1.2) return 'bg-warning text-dark'; // 20% acima do mínimo
      return 'bg-success';
    },
    getLoteStatusText(vencido, diasParaVencer) {
      if (vencido) return 'Vencido';
      if (diasParaVencer <= 30) return 'Atenção';
      if (diasParaVencer <= 90) return 'Monitorar';
      return 'Normal';
    },
    getLoteStatusBadgeClass(vencido, diasParaVencer) {
      if (vencido) return 'bg-danger';
      if (diasParaVencer <= 30) return 'bg-warning text-dark';
      if (diasParaVencer <= 90) return 'bg-info';
      return 'bg-success';
    },
    /** A API serializa relacionamentos em snake_case; camelCase fica como fallback */
    getGrupo(item) {
      const produto = item.produto || {};
      const grupo = produto.grupo_produto || produto.grupoProduto;
      return grupo?.nome || '-';
    },
    getUnidade(item) {
      const produto = item.produto || {};
      const unidade = produto.unidade_medida || produto.unidadeMedida;
      return unidade?.nome || '-';
    },
    /** Produto pertencente a um grupo de medicamentos controlados */
    isControlado(item) {
      const produto = item.produto || {};
      const grupo = produto.grupo_produto || produto.grupoProduto;
      return !!grupo?.controlado;
    },
    getSetorCompleto(setor) {
      if (!setor) return '-';
      const nomeSetor = setor.nome || '-';
      const nomeUnidade = setor.polo?.nome || setor.unidade?.nome;
      
      if (nomeUnidade) {
        return `${nomeSetor} - ${nomeUnidade}`;
      }
      return nomeSetor;
    },
    formatarSimpas(codigo) {
      if (!codigo) return '-';
      const s = String(codigo).trim();
      if (/^\d{15}$/.test(s)) {
        return `${s.slice(0, 2)}.${s.slice(2, 4)}.${s.slice(4, 6)}.${s.slice(6, 14)}-${s.slice(14)}`;
      }
      return s;
    },
    exportExcel() {
      if (!this.estoque || this.estoque.length === 0) return;
      
      // Preparar dados para o Excel
      const data = [];
      
      // Cabeçalho
      data.push(['Produto', 'Cód. SIMPAS', 'Cód.Barras', 'Unid.Medida', 'Grupo', 'Setor / Polo', 'Localização', 'Qtd Atual', 'Qtd Mínima', 'Status', 'Lote', 'Qtd Lote', 'Fabricação', 'Vencimento', 'Dias p/ Vencer', 'Status Lote']);
      
      // Dados
      for (const item of this.estoque) {
        if (item.lotes_info?.lotes && item.lotes_info.lotes.length > 0) {
          item.lotes_info.lotes.forEach((lote, idx) => {
            data.push([
              idx === 0 ? item.produto?.nome || '-' : '',
              idx === 0 ? this.formatarSimpas(item.produto?.codigo_simpas) : '',
              idx === 0 ? (item.produto?.codigo_barras || '') : '',
              idx === 0 ? this.getUnidade(item) : '',
              idx === 0 ? this.getGrupo(item) : '',
              idx === 0 ? this.getSetorCompleto(item.setor) : '',
              idx === 0 ? (item.localizacao || '') : '',
              idx === 0 ? item.quantidade_atual : '',
              idx === 0 ? item.quantidade_minima : '',
              idx === 0 ? this.getStatusDisponibilidadeText(item.status_disponibilidade) : '',
              lote.lote || '',
              lote.quantidade_disponivel || '',
              this.formatDate(lote.data_fabricacao),
              this.formatDate(lote.data_vencimento),
              lote.dias_para_vencer || '',
              this.getLoteStatusText(lote.vencido, lote.dias_para_vencer)
            ]);
          });
        } else {
          data.push([
            item.produto?.nome || '-',
            this.formatarSimpas(item.produto?.codigo_simpas),
            item.produto?.codigo_barras || '',
            this.getUnidade(item),
            this.getGrupo(item),
            this.getSetorCompleto(item.setor),
            item.localizacao || '',
            item.quantidade_atual,
            item.quantidade_minima,
            this.getStatusDisponibilidadeText(item.status_disponibilidade),
            'Sem lotes',
            '',
            '',
            '',
            '',
            ''
          ]);
        }
      }
      
      exportToExcel({
        data,
        columns: [
          { wch: 35 }, { wch: 18 }, { wch: 15 }, { wch: 12 },
          { wch: 20 }, { wch: 40 }, { wch: 15 }, { wch: 10 },
          { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 10 },
          { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
        ],
        filename: `relatorio_estoque_${new Date().toISOString().slice(0, 10)}.xlsx`,
        sheetName: 'Estoque',
      });
    },
    exportPdf() {
      if (!this.estoque || this.estoque.length === 0) return;

      const tableData = [];
      for (const item of this.estoque) {
        if (item.lotes_info?.lotes && item.lotes_info.lotes.length > 0) {
          item.lotes_info.lotes.forEach((lote, idx) => {
            tableData.push([
              idx === 0 ? (item.produto?.nome || '-') : '',
              idx === 0 ? this.formatarSimpas(item.produto?.codigo_simpas) : '',
              idx === 0 ? this.getSetorCompleto(item.setor) : '',
              idx === 0 ? item.quantidade_atual : '',
              idx === 0 ? item.quantidade_minima : '',
              idx === 0 ? this.getStatusDisponibilidadeText(item.status_disponibilidade).substring(0, 4) : '',
              lote.lote || '',
              lote.quantidade_disponivel || '',
              this.formatDate(lote.data_vencimento),
              lote.dias_para_vencer || '',
              this.getLoteStatusText(lote.vencido, lote.dias_para_vencer).substring(0, 8)
            ]);
          });
        } else {
          tableData.push([
            item.produto?.nome || '-',
            this.formatarSimpas(item.produto?.codigo_simpas),
            this.getSetorCompleto(item.setor),
            item.quantidade_atual,
            item.quantidade_minima,
            this.getStatusDisponibilidadeText(item.status_disponibilidade).substring(0, 4),
            '-',
            '',
            '',
            '',
            ''
          ]);
        }
      }

      const setorLinha = this.setorSelecionadoPolo
        ? `${this.setorSelecionadoNome} - ${this.setorSelecionadoPolo}`
        : this.setorSelecionadoNome;

      const subtitles = [
        `Data: ${new Date().toLocaleDateString('pt-BR')}`,
        `Setor: ${setorLinha}`,
      ];

      if (this.totalizadores.total_itens > 0) {
        subtitles.push(
          `Total: ${this.totalizadores.total_itens} itens | Disponiveis: ${this.totalizadores.total_produtos_disponiveis} | Indisponiveis: ${this.totalizadores.total_produtos_indisponiveis} | Abaixo minimo: ${this.totalizadores.total_abaixo_minimo}`
        );
      }

      exportToPdf({
        title: 'Relatorio de Estoque Atual',
        subtitle: subtitles,
        head: [['Produto', 'Cód. SIMPAS', 'Setor/Polo', 'Qtd', 'Min', 'Status', 'Lote', 'Q.Lote', 'Venc.', 'Dias', 'St.Lote']],
        body: tableData,
        filename: `relatorio_estoque_${new Date().toISOString().slice(0, 10)}.pdf`,
        orientation: 'landscape',
        headStyles: { fillColor: [25, 135, 84], fontSize: 7, fontStyle: 'bold' },
        bodyStyles: { fontSize: 6 },
        columnStyles: {
          0: { cellWidth: 43 },
          1: { cellWidth: 22 },
          2: { cellWidth: 45 },
          3: { cellWidth: 12 },
          4: { cellWidth: 12 },
          5: { cellWidth: 15 },
          6: { cellWidth: 18 },
          7: { cellWidth: 15 },
          8: { cellWidth: 18 },
          9: { cellWidth: 12 },
          10: { cellWidth: 18 },
        },
      });
    }
  }
}
</script>

<style scoped>
/* Banner do setor consultado */
.setor-banner {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 1.15rem;
  border: 1px solid #bcd8f7;
  border-left: 4px solid #0d6efd;
  border-radius: 10px;
  background: linear-gradient(90deg, #eff6ff 0%, #e3edfb 100%);
}

.setor-banner-icon {
  font-size: 26px;
  color: #0d6efd;
}

.setor-banner-info {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}

.setor-banner-label {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #0d6efd;
}

.setor-banner-nome {
  font-size: 1rem;
  font-weight: 700;
  color: #0b3d91;
}

.setor-banner-polo {
  font-size: 0.8rem;
  color: #4a7fbf;
}

.setor-banner-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.controlado-badge {
  background-color: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.estoque-row:hover {
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

.lotes-container {
  padding: 1.5rem;
  border-left: 4px solid #198754;
  margin-left: 50px;
}

.lotes-container h6 {
  color: #198754;
  font-weight: 600;
  font-size: 0.95rem;
  text-transform: uppercase;
  margin-bottom: 1rem;
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

.spinner-border {
  width: 3rem;
  height: 3rem;
}
</style>
