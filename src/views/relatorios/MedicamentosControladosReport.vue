<template>
  <TemplateAdmin>
    <div class="main-content">
      <div class="page-content">
        <div class="container-fluid py-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h4>Relatório de Medicamentos Controlados</h4>
              <p class="text-muted mb-0">
                Estoque, lotes e movimento dos medicamentos sujeitos a controle especial (Portaria SVS/MS 344/98).
              </p>
            </div>
            <div>
              <button class="btn btn-outline-secondary me-2" @click="resetFilters">Limpar</button>
              <button class="btn btn-primary" @click="loadRelatorio">Atualizar</button>
            </div>
          </div>

          <!-- Cabeçalho Institucional Regulatório (Portaria SVS/MS 344/98) -->
          <div class="card mb-3 border-warning shadow-sm">
            <div class="card-body py-2 px-3 bg-light d-flex flex-wrap justify-content-between align-items-center">
              <div>
                <span class="text-uppercase fw-bold text-warning-emphasis small d-block">
                  Controle Especial — Portaria SVS/MS nº 344/98
                </span>
                <span class="fw-semibold text-dark">
                  Razão Social / Unidade: {{ setorSelecionadoPolo || 'Unidade Hospitalar Integrada' }}
                </span>
                <span class="text-muted ms-2">| Setor / Farmácia: <strong>{{ setorSelecionadoNome }}</strong></span>
              </div>
              <div class="text-end text-muted small">
                <span>Jurisdição: <strong>CRF-BA</strong></span>
              </div>
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
                  <select v-model.number="filters.setor_id" class="form-select" :disabled="!podeFiltrarSetor">
                    <option v-if="podeFiltrarSetor" :value="''">Todos</option>
                    <option v-for="s in setoresFiltrados" :key="s.id" :value="s.id">{{ s.nome }}</option>
                  </select>
                  <small v-if="!podeFiltrarSetor" class="form-text text-muted">
                    Apenas administradores podem consultar outros setores.
                  </small>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Grupo Controlado</label>
                  <select v-model.number="filters.grupo_produto_id" class="form-select">
                    <option :value="''">Todos</option>
                    <option v-for="g in gruposControlados" :key="g.id" :value="g.id">{{ g.nome }}</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <label class="form-label">Lista (Portaria 344/98)</label>
                  <select v-model="filters.lista_portaria" class="form-select">
                    <option value="">Todas</option>
                    <option v-for="l in listasPortaria" :key="l" :value="l">Lista {{ l }}</option>
                  </select>
                </div>

                <div class="col-md-3">
                  <label class="form-label">Movimento de</label>
                  <input type="date" v-model="filters.date_from" class="form-control" />
                </div>
                <div class="col-md-3">
                  <label class="form-label">Movimento até</label>
                  <input type="date" v-model="filters.date_to" class="form-control" />
                </div>
                <div class="col-md-3 d-flex align-items-end">
                  <div class="form-check">
                    <input
                      id="somenteComSaldo"
                      class="form-check-input"
                      type="checkbox"
                      v-model="filters.somente_com_saldo"
                    />
                    <label class="form-check-label" for="somenteComSaldo">
                      Somente com saldo em estoque
                    </label>
                  </div>
                </div>
                <div class="col-md-3 d-flex align-items-end justify-content-end">
                  <button class="btn btn-outline-success me-2" @click="exportExcel" :disabled="itens.length===0">Exportar Excel</button>
                  <button class="btn btn-outline-danger" @click="exportPdf" :disabled="itens.length===0">Exportar PDF</button>
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
                    Total: {{ totalizadores.total_itens || 0 }} itens
                  </span>
                  <span class="badge bg-dark fs-6">
                    Quantidade em estoque: {{ totalizadores.quantidade_total || 0 }}
                  </span>
                  <span v-if="totalizadores.total_entradas_periodo" class="badge bg-success fs-6">
                    Entradas no período: {{ totalizadores.total_entradas_periodo }}
                  </span>
                  <span v-if="totalizadores.total_saidas_periodo" class="badge bg-info fs-6">
                    Saídas no período: {{ totalizadores.total_saidas_periodo }}
                  </span>
                  <span v-if="totalizadores.total_abaixo_minimo" class="badge bg-warning text-dark fs-6">
                    Abaixo do mínimo: {{ totalizadores.total_abaixo_minimo }}
                  </span>
                  <span v-if="totalizadores.total_lotes_vencidos" class="badge bg-danger fs-6">
                    Lotes vencidos: {{ totalizadores.total_lotes_vencidos }}
                  </span>
                  <span v-if="totalizadores.total_lotes_a_vencer" class="badge bg-warning text-dark fs-6">
                    Lotes a vencer (30d): {{ totalizadores.total_lotes_a_vencer }}
                  </span>
                </div>

                <!-- Distribuição por lista da Portaria -->
                <div v-if="listasComSaldo.length" class="mb-3 d-flex flex-wrap gap-2 align-items-center">
                  <span class="text-muted small text-uppercase fw-semibold me-1">Por lista:</span>
                  <span v-for="l in listasComSaldo" :key="l.lista" class="badge lista-badge">
                    {{ l.lista }}: {{ l.quantidade }}
                  </span>
                </div>

                <div v-if="periodo" class="text-muted small mb-3">
                  Movimento considerado de {{ formatDate(periodo.date_from) }} a {{ formatDate(periodo.date_to) }}.
                </div>

                <div class="table-responsive">
                  <table class="table table-hover">
                    <thead class="table-light">
                      <tr>
                        <th style="width: 50px;"></th>
                        <th>Medicamento</th>
                        <th style="width: 130px;">Cód. SIMPAS</th>
                        <th style="width: 90px;">Lista</th>
                        <th>Grupo</th>
                        <th style="width: 220px;">Setor / Polo</th>
                        <th style="width: 100px;" class="text-end">Estoque</th>
                        <th style="width: 90px;" class="text-end">Mínimo</th>
                        <th style="width: 100px;" class="text-end">Entradas</th>
                        <th style="width: 100px;" class="text-end">Saídas</th>
                      </tr>
                    </thead>
                    <tbody>
                      <template v-for="item in itens" :key="item.id">
                        <tr class="controlado-row" @click="toggleRow(item.id)" style="cursor: pointer;">
                          <td>
                            <span class="material-icons expand-icon">
                              {{ expandedRows[item.id] ? 'expand_more' : 'chevron_right' }}
                            </span>
                          </td>
                          <td>
                            <strong>{{ item.produto?.nome || '-' }}</strong>
                            <div class="text-muted small">{{ getUnidade(item) }}</div>
                          </td>
                          <td>{{ formatarSimpas(item.produto?.codigo_simpas) }}</td>
                          <td>
                            <span class="badge lista-badge">
                              {{ item.lista_portaria || item.produto?.lista_portaria || 'Sem lista' }}
                            </span>
                          </td>
                          <td>
                            <span class="badge bg-light text-dark">{{ getGrupo(item) }}</span>
                          </td>
                          <td>{{ getSetorCompleto(item.setor) }}</td>
                          <td class="text-end">
                            <span class="badge" :class="getQuantidadeBadgeClass(item.quantidade_atual, item.quantidade_minima)">
                              {{ item.quantidade_atual || 0 }}
                            </span>
                          </td>
                          <td class="text-end text-muted">{{ item.quantidade_minima || 0 }}</td>
                          <td class="text-end text-success fw-semibold">
                            {{ item.movimento_periodo?.entradas || 0 }}
                          </td>
                          <td class="text-end text-primary fw-semibold">
                            {{ item.movimento_periodo?.saidas || 0 }}
                          </td>
                        </tr>

                        <!-- Lotes do medicamento -->
                        <tr v-if="expandedRows[item.id]" class="expanded-content">
                          <td colspan="10" class="p-0">
                            <div class="lotes-container">
                              <div class="d-flex justify-content-between align-items-center mb-3">
                                <h6 class="mb-0">Lotes em estoque</h6>
                                <div class="d-flex gap-2">
                                  <span v-if="item.lotes_info?.total_lotes" class="badge bg-info">
                                    {{ item.lotes_info.total_lotes }}
                                    {{ item.lotes_info.total_lotes === 1 ? 'lote' : 'lotes' }}
                                  </span>
                                  <span v-if="item.lotes_info?.quantidade_total_lotes" class="badge bg-success">
                                    Total: {{ item.lotes_info.quantidade_total_lotes }} unidades
                                  </span>
                                  <span class="badge bg-secondary">
                                    Saldo do movimento: {{ item.movimento_periodo?.saldo_movimento || 0 }}
                                  </span>
                                </div>
                              </div>

                              <div v-if="!item.lotes_info?.lotes || item.lotes_info.lotes.length === 0" class="text-center text-muted py-3">
                                Nenhum lote disponível
                              </div>
                              <table v-else class="table table-sm mb-0">
                                <thead class="table-light">
                                  <tr>
                                    <th style="width: 150px;">Lote</th>
                                    <th style="width: 120px;">Quantidade</th>
                                    <th style="width: 150px;">Fabricação</th>
                                    <th style="width: 150px;">Vencimento</th>
                                    <th style="width: 120px;">Dias p/ Vencer</th>
                                    <th>Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr
                                    v-for="(lote, idx) in item.lotes_info.lotes"
                                    :key="lote.id || idx"
                                    :class="{ 'table-danger': lote.vencido, 'table-warning': !lote.vencido && lote.dias_para_vencer <= 30 }"
                                  >
                                    <td class="fw-semibold">{{ lote.lote || '-' }}</td>
                                    <td><span class="badge bg-info">{{ lote.quantidade_disponivel }}</span></td>
                                    <td class="text-muted small">{{ formatDate(lote.data_fabricacao) }}</td>
                                    <td class="text-muted small">{{ formatDate(lote.data_vencimento) }}</td>
                                    <td class="text-center">
                                      <span v-if="lote.vencido" class="badge bg-danger">Vencido</span>
                                      <span v-else-if="lote.dias_para_vencer <= 30" class="badge bg-warning text-dark">
                                        {{ lote.dias_para_vencer }} dias
                                      </span>
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

                <div v-if="itens.length===0" class="text-center py-5 text-muted">
                  <span class="material-icons" style="font-size: 48px; opacity: 0.3;">medication</span>
                  <p class="mt-3 mb-1">Nenhum medicamento controlado encontrado</p>
                  <p class="small mb-0">
                    Marque um grupo de produtos como "medicamentos controlados" no cadastro de grupos
                    para que os produtos apareçam aqui.
                  </p>
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
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default {
  name: 'MedicamentosControladosReport',
  components: { TemplateAdmin },
  data() {
    return {
      filters: {
        polo_id: '',
        setor_id: '',
        grupo_produto_id: '',
        lista_portaria: '',
        date_from: '',
        date_to: '',
        somente_com_saldo: false,
      },
      listasPortaria: [
        'A1', 'A2', 'A3', 'B1', 'B2',
        'C1', 'C2', 'C3', 'C4', 'C5',
        'D1', 'D2', 'E', 'F',
      ],
      itens: [],
      totalizadores: {
        total_itens: 0,
        total_produtos: 0,
        total_setores: 0,
        quantidade_total: 0,
        total_abaixo_minimo: 0,
        total_lotes_vencidos: 0,
        total_lotes_a_vencer: 0,
        total_entradas_periodo: 0,
        total_saidas_periodo: 0,
        por_lista: {},
      },
      periodo: null,
      loading: false,
      expandedRows: {},
    }
  },
  mounted() {
    functionsPolos.listAll(this);
    functionsSetores.listAll(this);
    functionsGrupoProduto.listAll(this);
    this.applyDefaultSetorFilter();
    this.loadRelatorio();
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
        this.loadRelatorio();
      }
    },
  },
  computed: {
    /** Setor em que o usuário está logado (cookie/store) */
    setorAtualId() {
      const id = this.$store.state.setorAtualId || this.$store.state.setorDetails?.id;
      return id ? Number(id) : '';
    },
    setorAtualDetalhes() {
      return this.$store.state.setorDetails || null;
    },
    listUsuariosSetor() {
      return this.$store.state.listUsuariosSetor || [];
    },
    /** Perfil 'admin' no setor atual (mesma lógica do Sidebar/Relatórios) */
    isAdmin() {
      if (this.$store.getters.isSuperAdmin) return true;

      const user = this.$store.state.user;
      if (!user) return false;
      return this.listUsuariosSetor.some((u) => {
        const uid = u.usuario_id || u.user_id || u.id || (u.usuario && u.usuario.id);
        const perfil = (u.perfil || (u.pivot && u.pivot.perfil) || '').toString().toLowerCase();
        return uid === user.id && perfil === 'admin';
      });
    },
    isAdminPolo() {
      return !!this.$store.state.user?.is_admin_polo;
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
          || this.$store.state.setorAtualNome
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
      return this.$store.state.listPolos || [];
    },
    setores() {
      const setoresData = this.$store.state.listSetoresGerais;
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
            || this.$store.state.setorAtualNome
            || 'Meu setor',
        }];
      }
      if (!this.filters.polo_id) return this.setores;
      return this.setores.filter(s => s.polo_id == this.filters.polo_id);
    },
    /** Apenas grupos marcados como medicamentos controlados */
    gruposControlados() {
      const grupos = this.$store.state.listGrupoProdutos || [];
      const lista = Array.isArray(grupos) ? grupos : (grupos.data || []);
      return lista.filter(g => !!g.controlado);
    },
    listasComSaldo() {
      const porLista = this.totalizadores.por_lista || {};
      return Object.keys(porLista).map(lista => ({
        lista,
        quantidade: porLista[lista],
      }));
    },
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
      this.loadRelatorio();
    },
    onPoloChange() {
      this.filters.setor_id = '';
    },
    toggleRow(itemId) {
      this.expandedRows[itemId] = !this.expandedRows[itemId];
    },
    async loadRelatorio() {
      // Não-admin fica restrito ao estoque do setor logado
      if (!this.podeFiltrarSetor && this.setorAtualId) {
        this.filters.setor_id = this.setorAtualId;
      }

      this.loading = true;
      try {
        const payloadFilters = {};
        if (this.filters.polo_id) payloadFilters.polo_id = this.filters.polo_id;
        if (this.filters.setor_id) payloadFilters.setor_id = this.filters.setor_id;
        if (this.filters.grupo_produto_id) payloadFilters.grupo_produto_id = this.filters.grupo_produto_id;
        if (this.filters.lista_portaria) payloadFilters.lista_portaria = this.filters.lista_portaria;
        if (this.filters.date_from) payloadFilters.date_from = this.filters.date_from;
        if (this.filters.date_to) payloadFilters.date_to = this.filters.date_to;
        if (this.filters.somente_com_saldo) payloadFilters.somente_com_saldo = true;

        const result = await functionsRelatorios.listMedicamentosControladosReport(this, payloadFilters);
        if (result && result.success) {
          this.itens = result.data || [];
          this.totalizadores = result.totalizadores || this.totalizadores;
          this.periodo = result.periodo || null;

          // Expandir todas as linhas por padrão
          this.expandedRows = {};
          this.itens.forEach(item => {
            this.expandedRows[item.id] = true;
          });
        } else {
          this.resetDados();
        }
      } catch (e) {
        console.error('Erro ao carregar relatório de medicamentos controlados:', e);
        this.resetDados();
      } finally {
        this.loading = false;
      }
    },
    resetDados() {
      this.itens = [];
      this.periodo = null;
      this.totalizadores = {
        total_itens: 0,
        total_produtos: 0,
        total_setores: 0,
        quantidade_total: 0,
        total_abaixo_minimo: 0,
        total_lotes_vencidos: 0,
        total_lotes_a_vencer: 0,
        total_entradas_periodo: 0,
        total_saidas_periodo: 0,
        por_lista: {},
      };
    },
    resetFilters() {
      this.filters.polo_id = '';
      this.filters.setor_id = '';
      this.filters.grupo_produto_id = '';
      this.filters.lista_portaria = '';
      this.filters.date_from = '';
      this.filters.date_to = '';
      this.filters.somente_com_saldo = false;
      this.applyDefaultSetorFilter();
      this.loadRelatorio();
    },
    formatDate(d) {
      if (!d) return '-';
      const str = String(d).split('T')[0];
      const parts = str.split('-');
      if (parts.length < 3) return d;
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
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
      return unidade?.nome || '';
    },
    getSetorCompleto(setor) {
      if (!setor) return '-';
      const nomeSetor = setor.nome || '-';
      const nomeUnidade = setor.polo?.nome || setor.unidade?.nome;
      return nomeUnidade ? `${nomeSetor} - ${nomeUnidade}` : nomeSetor;
    },
    getQuantidadeBadgeClass(quantidade, minimo) {
      const qtd = parseFloat(quantidade) || 0;
      const min = parseFloat(minimo) || 0;

      if (qtd === 0) return 'bg-secondary';
      if (qtd <= min) return 'bg-danger';
      if (qtd <= min * 1.2) return 'bg-warning text-dark';
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
    formatarSimpas(codigo) {
      if (!codigo) return '-';
      const s = String(codigo).trim();
      if (/^\d{15}$/.test(s)) {
        return `${s.slice(0, 2)}.${s.slice(2, 4)}.${s.slice(4, 6)}.${s.slice(6, 14)}-${s.slice(14)}`;
      }
      return s;
    },
    exportExcel() {
      if (!this.itens || this.itens.length === 0) return;

      const data = [];
      data.push([
        'Medicamento', 'Cód. SIMPAS', 'Lista 344/98', 'Grupo', 'Unid.Medida',
        'Setor / Polo', 'Qtd Atual', 'Qtd Mínima', 'Entradas Período', 'Saídas Período',
        'Lote', 'Qtd Lote', 'Fabricação', 'Vencimento', 'Dias p/ Vencer', 'Status Lote'
      ]);

      for (const item of this.itens) {
        const base = [
          item.produto?.nome || '-',
          this.formatarSimpas(item.produto?.codigo_simpas),
          item.lista_portaria || item.produto?.lista_portaria || '',
          this.getGrupo(item),
          this.getUnidade(item),
          this.getSetorCompleto(item.setor),
          item.quantidade_atual,
          item.quantidade_minima,
          item.movimento_periodo?.entradas || 0,
          item.movimento_periodo?.saidas || 0,
        ];

        if (item.lotes_info?.lotes && item.lotes_info.lotes.length > 0) {
          item.lotes_info.lotes.forEach((lote, idx) => {
            data.push([
              ...(idx === 0 ? base : base.map(() => '')),
              lote.lote || '',
              lote.quantidade_disponivel || '',
              this.formatDate(lote.data_fabricacao),
              this.formatDate(lote.data_vencimento),
              lote.dias_para_vencer ?? '',
              this.getLoteStatusText(lote.vencido, lote.dias_para_vencer)
            ]);
          });
        } else {
          data.push([...base, 'Sem lotes', '', '', '', '', '']);
        }
      }

      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Controlados');

      ws['!cols'] = [
        { wch: 35 }, { wch: 18 }, { wch: 12 }, { wch: 22 }, { wch: 12 },
        { wch: 35 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 14 },
        { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
      ];

      XLSX.writeFile(wb, `relatorio_medicamentos_controlados_${new Date().toISOString().slice(0,10)}.xlsx`);
    },
    exportPdf() {
      if (!this.itens || this.itens.length === 0) return;

      const doc = new jsPDF('landscape', 'mm', 'a4');

      // Cabeçalho Institucional Regulatório (Portaria SVS/MS 344/98)
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('LIVRO / RELATORIO DE MEDICAMENTOS SUJEITOS A CONTROLE ESPECIAL', 14, 13);
      doc.setFontSize(9);
      doc.text('Portaria SVS/MS nº 344/98 — Escrituracao Farmaceutica e Controle de Estoque', 14, 18);

      doc.setFont(undefined, 'normal');
      const razaoSocial = this.setorSelecionadoPolo || 'Unidade Hospitalar / Polo Central';
      const setorLinha = this.setorSelecionadoNome;
      const dataHoraEmissao = `${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

      doc.text(`Razao Social / Unidade Hospitalar: ${razaoSocial}`, 14, 24);
      doc.text(`Setor / Farmacia: ${setorLinha}`, 14, 29);
      doc.text(`Data de Emissao: ${dataHoraEmissao}`, 200, 24);

      if (this.periodo) {
        doc.text(
          `Periodo de Movimento: ${this.formatDate(this.periodo.date_from)} a ${this.formatDate(this.periodo.date_to)}`,
          200,
          29
        );
      }

      doc.setFontSize(8);
      doc.text(
        `Itens: ${this.totalizadores.total_itens || 0} | Estoque: ${this.totalizadores.quantidade_total || 0} | `
        + `Entradas: ${this.totalizadores.total_entradas_periodo || 0} | Saidas: ${this.totalizadores.total_saidas_periodo || 0} | `
        + `Lotes vencidos: ${this.totalizadores.total_lotes_vencidos || 0}`,
        14,
        35
      );

      const tableData = [];
      for (const item of this.itens) {
        const base = [
          item.produto?.nome || '-',
          this.formatarSimpas(item.produto?.codigo_simpas),
          item.lista_portaria || item.produto?.lista_portaria || '-',
          this.getSetorCompleto(item.setor),
          item.quantidade_atual,
          item.quantidade_minima,
          item.movimento_periodo?.entradas || 0,
          item.movimento_periodo?.saidas || 0,
        ];

        if (item.lotes_info?.lotes && item.lotes_info.lotes.length > 0) {
          item.lotes_info.lotes.forEach((lote, idx) => {
            tableData.push([
              ...(idx === 0 ? base : base.map(() => '')),
              lote.lote || '',
              lote.quantidade_disponivel || '',
              this.formatDate(lote.data_vencimento),
              this.getLoteStatusText(lote.vencido, lote.dias_para_vencer).substring(0, 8)
            ]);
          });
        } else {
          tableData.push([...base, '-', '', '', '']);
        }
      }

      autoTable(doc, {
        startY: 38,
        head: [['Medicamento', 'Cód. SIMPAS', 'Lista', 'Setor/Polo', 'Qtd', 'Min', 'Ent.', 'Said.', 'Lote', 'Q.Lote', 'Venc.', 'St.Lote']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [180, 83, 9], fontSize: 7, fontStyle: 'bold' },
        bodyStyles: { fontSize: 6 },
        columnStyles: {
          0: { cellWidth: 44 },  // Medicamento
          1: { cellWidth: 23 },  // Cód. SIMPAS
          2: { cellWidth: 12 },  // Lista
          3: { cellWidth: 39 },  // Setor/Polo
          4: { cellWidth: 12 },  // Qtd
          5: { cellWidth: 12 },  // Min
          6: { cellWidth: 13 },  // Ent.
          7: { cellWidth: 13 },  // Said.
          8: { cellWidth: 20 },  // Lote
          9: { cellWidth: 14 },  // Q.Lote
          10: { cellWidth: 18 }, // Venc.
          11: { cellWidth: 18 }  // St.Lote
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.text(
            `Pagina ${data.pageNumber} de ${pageCount}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 6,
            { align: 'center' }
          );
        }
      });

      // Rodapé formal da Portaria 344/98 (Campos de Responsabilidade Técnica)
      const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 150;
      let yAssinatura = finalY + 14;

      if (yAssinatura + 24 > doc.internal.pageSize.height - 12) {
        doc.addPage();
        yAssinatura = 30;
      }

      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text('Farmacêutico(a) Responsável Técnico(a): ________________________________', 14, yAssinatura);
      doc.text('CRF-BA: _______________', 190, yAssinatura);

      doc.text(`Data de Emissão: ${dataHoraEmissao}`, 14, yAssinatura + 9);
      doc.text('Assinatura / Carimbo: ________________________________', 190, yAssinatura + 9);

      doc.save(`relatorio_medicamentos_controlados_${new Date().toISOString().slice(0,10)}.pdf`);
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

.lista-badge {
  background-color: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
}

.controlado-row:hover {
  background-color: #fffbeb;
}

.expand-icon {
  font-size: 20px;
  color: #6c757d;
}

.expanded-content {
  background-color: #fffbeb;
}

.lotes-container {
  padding: 1.5rem;
  border-left: 4px solid #d97706;
  margin-left: 50px;
}

.lotes-container h6 {
  color: #b45309;
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
