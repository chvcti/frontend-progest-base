<template>
  <TemplateAdmin>
    <div class="main-content">
      <div class="page-content">
        <div class="container-fluid py-4">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h4>Relatório de Usuários</h4>
              <p class="text-muted mb-0">Listagem completa de usuários cadastrados e seus vínculos com setores.</p>
            </div>
            <div>
              <button class="btn btn-outline-secondary me-2" @click="resetFilters">Limpar</button>
              <button class="btn btn-primary" @click="loadUsuarios">Atualizar</button>
            </div>
          </div>

          <div class="card mb-3">
            <div class="card-body">
              <div class="row g-2">
                <div class="col-md-2">
                  <label class="form-label">Status</label>
                  <select v-model="filters.status" class="form-select">
                    <option value="">Todos</option>
                    <option value="A">Ativo</option>
                    <option value="I">Inativo</option>
                  </select>
                </div>
                <div class="col-md-2">
                  <label class="form-label">Regime de Contratação</label>
                  <select v-model.number="filters.regime_contratacao_id_id" class="form-select">
                    <option :value="''">Todos</option>
                    <option v-for="tv in RegimesContratacao" :key="tv.id" :value="tv.id">{{ tv.nome }}</option>
                  </select>
                </div>
                <div class="col-md-2">
                  <label class="form-label">Setor</label>
                  <select v-model.number="filters.setor_id" class="form-select">
                    <option :value="''">Todos</option>
                    <option v-for="s in setores" :key="s.id" :value="s.id">{{ s.nome }}</option>
                  </select>
                </div>
                <div class="col-md-2">
                  <label class="form-label">Perfil</label>
                  <select v-model="filters.perfil" class="form-select">
                    <option value="">Todos</option>
                    <option value="admin">Admin</option>
                    <option value="almoxarife">Almoxarife</option>
                    <option value="solicitante">Solicitante</option>
                    <option value="visualizador">Visualizador</option>
                  </select>
                </div>
                <div class="col-md-2 d-flex align-items-end justify-content-end">
                  <button class="btn btn-outline-success me-2" @click="exportExcel" :disabled="usuarios.length===0">Exportar Excel</button>
                  <button class="btn btn-outline-danger" @click="exportPdf" :disabled="usuarios.length===0">Exportar PDF</button>
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
                    Total: {{ totalizadores.total_usuarios }} usuários
                  </span>
                  <span v-if="totalizadores.total_ativos" class="badge bg-success fs-6">
                    Ativos: {{ totalizadores.total_ativos }}
                  </span>
                  <span v-if="totalizadores.total_inativos" class="badge bg-secondary fs-6">
                    Inativos: {{ totalizadores.total_inativos }}
                  </span>
                </div>
                <div class="table-responsive">
                  <table class="table table-striped table-hover">
                    <thead>
                      <tr>
                        <th style="width: 50px;"></th>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>CPF</th>
                        <th>Telefone</th>
                        <th>Data Nascimento</th>
                        <th>Contratação</th>
                        <th>Status</th>
                        <th>Total Setores</th>
                      </tr>
                    </thead>
                    <tbody>
                      <template v-for="u in usuarios" :key="u.id">
                        <!-- Linha principal do usuário -->
                        <tr class="usuario-row" @click="toggleRow(u.id)" style="cursor: pointer;">
                          <td>
                            <span v-if="expandedRows[u.id]">▼</span>
                            <span v-else>▶</span>
                          </td>
                          <td>{{ u.id }}</td>
                          <td class="fw-semibold">{{ u.name }}</td>
                          <td>{{ u.email }}</td>
                          <td>{{ formatCPF(u.cpf) }}</td>
                          <td>{{ formatTelefone(u.telefone) }}</td>
                          <td>{{ formatDate(u.data_nascimento) }}</td>
                          <td>
                            <span class="badge bg-info">{{ u.regime_contratacao_id?.nome || '-' }}</span>
                          </td>
                          <td>
                            <span class="badge" :class="u.status === 'A' ? 'bg-success' : 'bg-secondary'">
                              {{ u.status === 'A' ? 'Ativo' : 'Inativo' }}
                            </span>
                          </td>
                          <td>
                            <span class="badge bg-primary">{{ u.total_setores || u.setores?.length || 0 }} setores</span>
                          </td>
                        </tr>
                        
                        <!-- Linha expansível com setores do usuário -->
                        <tr v-if="expandedRows[u.id]" class="expanded-content">
                          <td colspan="10" class="p-0 bg-light">
                            <div class="p-3">
                              <h6 class="mb-3">Setores e Perfis</h6>
                              <div v-if="!u.setores || u.setores.length === 0" class="text-muted">
                                Este usuário não está vinculado a nenhum setor.
                              </div>
                              <div v-else class="table-responsive">
                                <table class="table table-sm table-bordered bg-white mb-0">
                                  <thead class="table-secondary">
                                    <tr>
                                      <th>Setor</th>
                                      <th>Polo</th>
                                      <th>Tipo</th>
                                      <th>Perfil</th>
                                      <th>Data Vínculo</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr v-for="vinculo in u.setores" :key="vinculo.id">
                                      <td class="fw-semibold">{{ vinculo.nome || '-' }}</td>
                                      <td>{{ vinculo.polo?.nome || vinculo.unidade?.nome || '-' }}</td>
                                      <td>{{ vinculo.tipo || '-' }}</td>
                                      <td>
                                        <span class="badge" :class="getPerfilClass(vinculo.perfil)">
                                          {{ vinculo.perfil || '-' }}
                                        </span>
                                      </td>
                                      <td class="text-muted small">{{ formatDateTime(vinculo.data_vinculo) }}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </template>
                    </tbody>
                  </table>
                </div>
                <div v-if="usuarios.length===0" class="text-center py-4 text-muted">Nenhum usuário encontrado</div>
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
import functionsSetores from '@/functions/cad_setores.js'
import functionsregimeContratacao from '@/functions/cad_regime_contratacao.js'
import { exportToExcel, exportToPdf } from '@/utils/exportUtils'

export default {
  name: 'UsuariosReport',
  components: { TemplateAdmin },
  data() {
    return {
      filters: {
        status: '',
        regime_contratacao_id_id: '',
        setor_id: '',
        perfil: '',
      },
      usuarios: [],
      loading: false,
      expandedRows: {},
      totalizadores: {
        total_usuarios: 0,
        total_ativos: 0,
        total_inativos: 0
      }
    }
  },
  mounted() {
    functionsSetores.listAll(this);
    functionsregimeContratacao.listAll(this);
    this.loadUsuarios();
  },
  computed: {
    setores() {
      const setoresData = this.$store.state.cadastros.listSetoresGerais;
      if (Array.isArray(setoresData)) return setoresData;
      if (setoresData?.data) return setoresData.data;
      return [];
    },
    RegimesContratacao() {
      return this.$store.state.cadastros.listRegimesContratacao || [];
    }
  },
  methods: {
    toggleRow(usuarioId) {
      this.expandedRows[usuarioId] = !this.expandedRows[usuarioId];
    },
    getPerfilClass(perfil) {
      const perfilMap = {
        'admin': 'bg-danger',
        'almoxarife': 'bg-primary',
        'solicitante': 'bg-success',
        'visualizador': 'bg-secondary'
      };
      return perfilMap[perfil?.toLowerCase()] || 'bg-secondary';
    },
    formatCPF(cpf) {
      if (!cpf) return '-';
      const cleaned = String(cpf).replace(/\D/g, '');
      if (cleaned.length !== 11) return cpf;
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    },
    formatTelefone(tel) {
      if (!tel) return '-';
      const cleaned = String(tel).replace(/\D/g, '');
      if (cleaned.length === 11) {
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
      } else if (cleaned.length === 10) {
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
      }
      return tel;
    },
    formatDateTime(dt) {
      if (!dt) return '-';
      const str = String(dt).replace(' ', 'T');
      const [datePart, timePart] = str.split('T');
      const [ano, mes, dia] = datePart.split('-');
      const time = timePart ? timePart.slice(0, 5) : '';
      return `${dia}/${mes}/${ano}${time ? ' ' + time : ''}`;
    },
    formatDate(d) {
      if (!d) return '-';
      const str = String(d).split('T')[0];
      const parts = str.split('-');
      if (parts.length < 3) return d;
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    },
    async loadUsuarios() {
      this.loading = true;
      try {
        const payloadFilters = {};
        if (this.filters.status) payloadFilters.status = this.filters.status;
        if (this.filters.regime_contratacao_id_id) payloadFilters.regime_contratacao_id_id = this.filters.regime_contratacao_id_id;
        if (this.filters.setor_id) payloadFilters.setor_id = this.filters.setor_id;
        if (this.filters.perfil) payloadFilters.perfil = this.filters.perfil;

        const result = await functionsRelatorios.listUsuariosReport(this, payloadFilters);
        if (result && result.success) {
          this.usuarios = result.data || [];
          
          // Capturar totalizadores se existirem
          if (result.totalizadores) {
            this.totalizadores = result.totalizadores;
          } else {
            // Calcular localmente se não vier do backend
            this.totalizadores = {
              total_usuarios: this.usuarios.length,
              total_ativos: this.usuarios.filter(u => u.status === 'A').length,
              total_inativos: this.usuarios.filter(u => u.status === 'I').length
            };
          }
          
          // Expandir todas as linhas por padrão
          this.expandedRows = {};
          this.usuarios.forEach(usuario => {
            this.expandedRows[usuario.id] = true;
          });
        } else {
          this.usuarios = [];
          this.totalizadores = { total_usuarios: 0, total_ativos: 0, total_inativos: 0 };
        }
      } catch (e) {
        console.error('Erro ao carregar relatório de usuários:', e);
        this.usuarios = [];
        this.totalizadores = { total_usuarios: 0, total_ativos: 0, total_inativos: 0 };
      } finally {
        this.loading = false;
      }
    },
    resetFilters() {
      this.filters.status = '';
      this.filters.regime_contratacao_id_id = '';
      this.filters.setor_id = '';
      this.filters.perfil = '';
      this.loadUsuarios();
    },
    exportExcel() {
      if (!this.usuarios || this.usuarios.length === 0) return;
      
      const data = [];
      
      // Cabeçalho
      data.push(['ID', 'Nome', 'Email', 'CPF', 'Telefone', 'Data Nascimento', 'Contratação', 'Status', 'Setor', 'Polo', 'Perfil']);
      
      // Dados
      for (const u of this.usuarios) {
        if (u.setores && u.setores.length > 0) {
          u.setores.forEach((vinculo, idx) => {
            data.push([
              idx === 0 ? u.id : '',
              idx === 0 ? u.name : '',
              idx === 0 ? u.email : '',
              idx === 0 ? this.formatCPF(u.cpf) : '',
              idx === 0 ? this.formatTelefone(u.telefone) : '',
              idx === 0 ? this.formatDate(u.data_nascimento) : '',
              idx === 0 ? (u.regime_contratacao_id?.nome || '-') : '',
              idx === 0 ? (u.status === 'A' ? 'Ativo' : 'Inativo') : '',
              vinculo.nome || '-',
              vinculo.polo?.nome || vinculo.unidade?.nome || '-',
              vinculo.perfil || '-'
            ]);
          });
        } else {
          data.push([
            u.id,
            u.name,
            u.email,
            this.formatCPF(u.cpf),
            this.formatTelefone(u.telefone),
            this.formatDate(u.data_nascimento),
            u.regime_contratacao_id?.nome || '-',
            u.status === 'A' ? 'Ativo' : 'Inativo',
            'Sem setor',
            '-',
            '-'
          ]);
        }
      }
      
      exportToExcel({
        data,
        columns: [
          { wch: 8 },   // ID
          { wch: 30 },  // Nome
          { wch: 35 },  // Email
          { wch: 15 },  // CPF
          { wch: 15 },  // Telefone
          { wch: 14 },  // Data Nascimento
          { wch: 15 },  // Contratação
          { wch: 10 },  // Status
          { wch: 25 },  // Setor
          { wch: 25 },  // Polo
          { wch: 15 }   // Perfil
        ],
        filename: `relatorio_usuarios_${new Date().toISOString().slice(0, 10)}.xlsx`,
        sheetName: 'Usuários'
      });
    },
    exportPdf() {
      if (!this.usuarios || this.usuarios.length === 0) return;
      
      const filtros = [];
      if (this.filters.status) filtros.push(`Status: ${this.filters.status === 'A' ? 'Ativo' : 'Inativo'}`);
      if (this.filters.regime_contratacao_id) filtros.push(`Contratação: ${this.filters.regime_contratacao_id}`);
      
      // Preparar dados da tabela
      const tableData = [];
      for (const u of this.usuarios) {
        if (u.setores && u.setores.length > 0) {
          u.setores.forEach((vinculo, idx) => {
            tableData.push([
              idx === 0 ? u.id : '',
              idx === 0 ? u.name : '',
              idx === 0 ? u.email : '',
              idx === 0 ? this.formatCPF(u.cpf) : '',
              idx === 0 ? (u.regime_contratacao_id?.nome || '-') : '',
              idx === 0 ? (u.status === 'A' ? 'Ativo' : 'Inativo') : '',
              vinculo.nome || '-',
              vinculo.perfil || '-'
            ]);
          });
        } else {
          tableData.push([
            u.id,
            u.name,
            u.email,
            this.formatCPF(u.cpf),
            u.regime_contratacao_id?.nome || '-',
            u.status === 'A' ? 'Ativo' : 'Inativo',
            'Sem setor',
            '-'
          ]);
        }
      }
      
      exportToPdf({
        title: 'Relatório de Usuários',
        subtitle: filtros.length > 0 ? `Filtros: ${filtros.join(', ')}` : '',
        head: [['ID', 'Nome', 'Email', 'CPF', 'Contratação', 'Status', 'Setor', 'Perfil']],
        body: tableData,
        filename: `relatorio_usuarios_${new Date().toISOString().slice(0, 10)}.pdf`,
        orientation: 'landscape',
        headStyles: { fillColor: [13, 110, 253], fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 10 },  // ID
          1: { cellWidth: 45 },  // Nome
          2: { cellWidth: 55 },  // Email
          3: { cellWidth: 25 },  // CPF
          4: { cellWidth: 25 },  // Contratação
          5: { cellWidth: 18 },  // Status
          6: { cellWidth: 40 },  // Setor
          7: { cellWidth: 22 }   // Perfil
        }
      });
    }
  }
}
</script>

<style scoped>
.usuario-row:hover {
  background-color: #f8f9fa;
}

.expanded-content {
  background-color: #f8f9fa;
}
</style>
