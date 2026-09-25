<template>
  <Dialog v-model:open="dialogOpen">
    <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader class="text-start">
        <DialogTitle class="flex gap-2">
          <i class="mdi mdi-package-variant text-primary"></i>
          {{ modalTitle }}
        </DialogTitle>
        <DialogDescription>
          Visualização detalhada dos lotes do produto selecionado.
        </DialogDescription>
      </DialogHeader>

      <!-- Slot default (body) -->
      <div>
        <div v-if="temProduto">
          <!-- Header com informações do produto -->
          <div class="card border-0 bg-light mb-4">
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-2">
                    <strong>Marca:</strong>
                    <span class="ms-2">{{ produto.marca || "-" }}</span>
                  </div>
                  <div class="mb-2">
                    <strong>Grupo:</strong>
                    <span class="ms-2">{{ produtoGrupoNome || "-" }}</span>
                  </div>
                  <div class="mb-2">
                    <strong>Unidade de Medida:</strong>
                    <span class="ms-2">
                      {{ produtoUnidadeNome || "-" }}
                      <span v-if="unidadeAbreviacao"
                        >({{ unidadeAbreviacao }})</span
                      >
                    </span>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-2">
                    <strong>Setor:</strong>
                    <span class="ms-2">{{ displaySetor?.nome || "-" }}</span>
                  </div>
                  <div class="mb-2">
                    <strong>Estoque ID:</strong>
                    <span class="ms-2">#{{ estoqueId }}</span>
                  </div>
                  <div class="mb-2">
                    <strong>Quantidade Atual:</strong>
                    <span class="ms-2">
                      {{ quantidadeAtual }}
                      {{ unidadeAbreviacao }}
                    </span>
                  </div>
                  <div class="mb-2">
                    <strong>Quantidade Mínima:</strong>
                    <span class="ms-2">
                      {{ quantidadeMinima }}
                      {{ unidadeAbreviacao }}
                    </span>
                  </div>
                  <div class="mb-2" v-if="canViewFinanceiro">
                    <strong>Valor Total em Estoque:</strong>
                    <span class="ms-2 font-bold text-indigo-700">
                      {{ formatarMoeda(totalValorFinanceiro) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Loading de Lotes -->
          <div v-if="loadingLotes" class="text-center py-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Carregando lotes...</span>
            </div>
            <p class="mt-2 text-muted">Carregando lotes...</p>
          </div>

          <!-- Tabela de Lotes -->
          <div v-else-if="lotes.length > 0">
            <h6 class="mb-3">
              <i class="mdi mdi-format-list-bulleted me-2"></i>
              Lotes Disponíveis ({{ lotes.length }})
            </h6>
            <div class="table-responsive">
              <table class="table table-hover table-striped mb-0">
                <thead class="table-light">
                  <tr>
                    <th class="text-center">#</th>
                    <th class="text-start">Lote</th>
                    <th class="text-center">Quantidade Disponível</th>
                    <th v-if="canViewFinanceiro" class="text-end">Valor Unitário</th>
                    <th v-if="canViewFinanceiro" class="text-end">Subtotal Lote</th>
                    <th class="text-center">Data de Fabricação</th>
                    <th class="text-center">Data de Vencimento</th>
                    <th class="text-center">Status</th>
                    <th class="text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(lote, index) in lotes" :key="lote.id">
                    <td class="text-center">{{ index + 1 }}</td>
                    <td class="text-start">
                      {{ lote.lote }}
                    </td>
                    <td class="text-center">
                      {{ formatarQuantidade(lote.quantidade_disponivel) }}
                      {{ unidadeAbreviacao }}
                    </td>
                    <td v-if="canViewFinanceiro" class="text-end font-semibold text-slate-700">
                      {{ formatarMoeda(lote.valor_unitario) }}
                    </td>
                    <td v-if="canViewFinanceiro" class="text-end font-bold text-slate-800">
                      {{ formatarMoeda(lote.valor_total_lote !== undefined && lote.valor_total_lote !== null ? lote.valor_total_lote : (lote.valor_unitario ? lote.valor_unitario * lote.quantidade_disponivel : null)) }}
                    </td>
                    <td class="text-center">
                      {{ formatarData(lote.data_fabricacao) }}
                    </td>
                    <td class="text-center">
                      {{ formatarData(lote.data_vencimento) }}
                    </td>
                    <td class="text-center">
                      <span
                        :class="getStatusVencimentoClass(lote.data_vencimento)"
                      >
                        {{ getStatusVencimentoTexto(lote.data_vencimento) }}
                      </span>
                    </td>
                    <td class="text-center">
                      <button 
                        type="button" 
                        class="btn btn-sm btn-outline-danger"
                        title="Registrar Baixa / Consumo Interno"
                        @click="abrirBaixa(lote)"
                      >
                        <i class="mdi mdi-package-down"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
                <tfoot class="table-light">
                  <tr>
                    <td colspan="2" class="text-end">
                      <strong>Total:</strong>
                    </td>
                    <td class="text-center">
                      <strong class="text-primary">
                        {{ totalQuantidade }}
                        {{ unidadeAbreviacao }}
                      </strong>
                    </td>
                    <td v-if="canViewFinanceiro" colspan="2" class="text-end">
                      <strong class="text-indigo-700 font-bold">
                        {{ formatarMoeda(totalValorFinanceiro) }}
                      </strong>
                    </td>
                    <td colspan="3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- Mensagem quando não há lotes -->
          <div v-else class="text-center py-5">
            <i
              class="mdi mdi-package-variant-closed display-4 text-muted mb-3"
            ></i>
            <h5>Nenhum lote encontrado</h5>
            <p class="text-muted">
              Este produto não possui lotes registrados nesta unidade.
            </p>
          </div>
        </div>

        <!-- Mensagem quando não há produto -->
        <div v-else class="text-center py-5">
          <i
            class="mdi mdi-alert-circle-outline display-4 text-warning mb-3"
          ></i>
          <h5>Produto não selecionado</h5>
          <p class="text-muted">
            Selecione um produto para visualizar os lotes.
          </p>
        </div>
      </div>
      <!-- Fim slot default (body) -->

      <div class="flex justify-end space-x-2 mt-4">
        <button type="button" class="btn btn-secondary" @click="fecharModal">
          <i class="mdi mdi-close me-1"></i>
          Fechar
        </button>
      </div>
    </DialogContent>
  </Dialog>
  
  <ModalConsumoInterno ref="modalConsumoInterno" :setor="setor" @sucesso="onConsumoSucesso" />
</template>

<script>
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ModalConsumoInterno from "../setorAtual/ModalConsumoInterno.vue";

export default {
  name: "ModalVisualizarLotesProduto",
  components: {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    ModalConsumoInterno,
  },
  emits: ["consumoSucesso", "close"],
  props: {
    idModal: {
      type: String,
      default: "modalVisualizarLotesProduto",
    },
    produto: {
      type: Object,
      default: () => ({}),
    },
    unidade: {
      type: Object,
      default: () => ({}),
    },
    // Novo prop para compatibilidade com refatoração: setor (substitui "unidade" em algumas views)
    setor: {
      type: Object,
      default: () => ({}),
    },
    estoqueId: {
      type: [Number, String],
      default: null,
    },
    quantidadeAtual: {
      type: [Number, String],
      default: 0,
    },
    quantidadeMinima: {
      type: [Number, String],
      default: 0,
    },
  },
  data() {
    return {
      loadingLotes: false,
      dialogOpen: false,
    };
  },
  computed: {
    modalTitle() {
      return this.produto?.nome
        ? `Lotes - ${this.produto.nome}`
        : "Lotes do Produto";
    },
    lotes() {
      return this.$store.state.listEstoqueLote || [];
    },
    totalQuantidade() {
      const total = this.lotes.reduce((total, lote) => {
        const qtd = parseFloat(lote.quantidade_disponivel) || 0;
        return total + qtd;
      }, 0);
      return Number.isInteger(total) ? total.toString() : total.toFixed(3);
    },
    canViewFinanceiro() {
      if (this.lotes.length > 0 && this.lotes.some(l => l.valor_unitario !== null && l.valor_unitario !== undefined)) {
        return true;
      }
      const u = this.$store.state.user || {};
      const isSuper = Boolean(u.is_super_admin) || Boolean(u.is_admin);
      const setorNome = (this.displaySetor?.nome || this.$store.state.setorDetails?.nome || '').toUpperCase();
      const isCAF = setorNome.includes('CAF') || setorNome.includes('CENTRAL DE ABASTECIMENTO');
      return isSuper && isCAF;
    },
    totalValorFinanceiro() {
      const total = this.lotes.reduce((acc, lote) => {
        const val = parseFloat(lote.valor_total_lote);
        if (!isNaN(val)) return acc + val;
        const vUnit = parseFloat(lote.valor_unitario);
        const qtd = parseFloat(lote.quantidade_disponivel) || 0;
        if (!isNaN(vUnit)) return acc + (vUnit * qtd);
        return acc;
      }, 0);
      return total;
    },
    temProduto() {
      return !!(this.produto && this.produto.id);
    },
    produtoGrupoNome() {
      return (
        this.produto?.grupo_produto?.nome ||
        this.produto?.grupoProduto?.nome ||
        this.produto?.grupo?.nome ||
        ""
      );
    },
    produtoUnidadeNome() {
      return (
        this.produto?.unidade_medida?.nome ||
        this.produto?.unidadeMedida?.nome ||
        this.produto?.unidade?.nome ||
        ""
      );
    },
    // Exibe o setor — usa `setor` se fornecido, senão `unidade` para compatibilidade
    displaySetor() {
      return this.setor && Object.keys(this.setor).length > 0
        ? this.setor
        : this.unidade || null;
    },
    // Abreviação da unidade de medida do produto — tenta nomes diferentes conforme fetched payload
    unidadeAbreviacao() {
      return (
        this.produto?.unidade_medida?.abreviacao ||
        this.produto?.unidadeMedida?.abreviacao ||
        this.produto?.unidade_medida?.abreviatura ||
        this.produto?.unidadeMedida?.abreviatura ||
        ""
      );
    },
  },
  methods: {
    abrirBaixa(lote) {
      if (this.$refs.modalConsumoInterno) {
        this.$refs.modalConsumoInterno.openModal(this.produto, lote);
      }
    },
    onConsumoSucesso() {
      // Refresh the lots and notify parent to refresh main list
      this.$emit('consumoSucesso');
      this.$store.commit("setListEstoqueLote", []);
      
      this.$toast?.s("Estoque atualizado.");
      this.fecharModal();
    },
    formatarData(data) {
      if (!data) return "-";
      return new Date(data).toLocaleDateString("pt-BR", { timeZone: "UTC" });
    },
    formatarMoeda(valor) {
      if (valor === null || valor === undefined || isNaN(valor)) return "-";
      return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    },
    formatarQuantidade(quantidade) {
      const qtd = parseFloat(quantidade) || 0;
      return Number.isInteger(qtd) ? qtd.toString() : qtd.toFixed(3);
    },
    getStatusVencimentoTexto(dataVencimento) {
      if (!dataVencimento) return "-";

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      // Extrair apenas a parte da data (YYYY-MM-DD)
      const dataLimpa = dataVencimento.split("T")[0];
      const vencimento = new Date(dataLimpa + "T00:00:00");
      vencimento.setHours(0, 0, 0, 0);

      const diffTime = vencimento - hoje;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return "Vencido";
      } else if (diffDays === 0) {
        return "Vence Hoje";
      } else if (diffDays <= 30) {
        return `Vence em ${diffDays} dia(s)`;
      } else if (diffDays <= 90) {
        return "Vence em breve";
      } else {
        return "Dentro da validade";
      }
    },
    getStatusVencimentoClass(dataVencimento) {
      if (!dataVencimento) return "badge bg-secondary";

      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      // Extrair apenas a parte da data (YYYY-MM-DD)
      const dataLimpa = dataVencimento.split("T")[0];
      const vencimento = new Date(dataLimpa + "T00:00:00");
      vencimento.setHours(0, 0, 0, 0);

      const diffTime = vencimento - hoje;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return "badge bg-danger"; // Vencido
      } else if (diffDays === 0) {
        return "badge bg-danger"; // Vence hoje
      } else if (diffDays <= 30) {
        return "badge bg-warning text-dark"; // Vence em até 30 dias
      } else if (diffDays <= 90) {
        return "badge bg-info"; // Vence em até 90 dias
      } else {
        return "badge bg-success"; // Dentro da validade
      }
    },
    fecharModal() {
      this.dialogOpen = false;
    },
  },
};
</script>

<style scoped>
.table-hover tbody tr:hover {
  background-color: #f8f9fa;
  transition: background-color 0.2s ease;
}
</style>
