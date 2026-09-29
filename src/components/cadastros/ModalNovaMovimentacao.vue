<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader class="text-start">
        <DialogTitle class="flex gap-2">
          <i :class="tipoMovimentacao === 'D' ? 'mdi mdi-undo-variant text-amber-600' : 'mdi mdi-file-document-edit-outline text-primary'"></i>
          {{ rascunho ? 'Editar Rascunho' : (tipoMovimentacao === 'D' ? 'Nova Devolução de Produtos' : 'Nova Requisição') }}
        </DialogTitle>
        <DialogDescription>
          {{ tipoMovimentacao === 'D' 
            ? 'Selecione o setor distribuidor receptor e os itens que deseja devolver ao estoque.' 
            : 'Preencha os dados e os itens. Você pode salvar como rascunho ou finalizar a solicitação.' }}
        </DialogDescription>
      </DialogHeader>

      <!-- Alternador entre Requisição e Devolução -->
      <div v-if="!rascunho" class="flex items-center gap-2 my-2 p-1 bg-slate-100 rounded-lg w-fit">
        <button
          type="button"
          @click="tipoMovimentacao = 'T'"
          :class="[
            'px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5',
            tipoMovimentacao === 'T'
              ? 'bg-white text-primary shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          ]"
        >
          <i class="mdi mdi-arrow-down-bold-circle-outline"></i>
          Requisição / Pedido
        </button>
        <button
          type="button"
          @click="tipoMovimentacao = 'D'"
          :class="[
            'px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5',
            tipoMovimentacao === 'D'
              ? 'bg-white text-amber-600 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          ]"
        >
          <i class="mdi mdi-undo-variant"></i>
          Devolução ao Distribuidor
        </button>
      </div>

      <form @submit.prevent="finalizarSolicitacao" novalidate>
        <!-- Setor Origem -> Setor Destino flow -->
        <div class="flex flex-wrap items-center gap-4 mb-4">
          <!-- Quando Requisição: Distribuidor é Origem, Setor Atual é Destino -->
          <!-- Quando Devolução: Setor Atual é Origem (devolve), Distribuidor é Destino (recebe) -->
          
          <template v-if="tipoMovimentacao === 'T'">
            <!-- Origem (Distribuidor) -->
            <div class="flex-grow md:flex-grow-0 md:w-[300px]">
              <Label
                for="setorOrigem"
                class="text-xs text-muted-foreground block mb-1"
              >
                Setor Distribuidor (Origem) <span class="text-danger">*</span>
              </Label>
              <Select
                v-model="form.setorOrigemId"
                @update:modelValue="onSetorOrigemChange"
              >
                <SelectTrigger
                  id="setorOrigem"
                  :class="{ 'border-red-500': erros.setorOrigem }"
                >
                  <SelectValue placeholder="Selecione o setor distribuidor" />
                </SelectTrigger>
                <SelectContent>
                  <div
                    class="px-2 py-2 sticky top-0 bg-white border-b z-10"
                    @keydown.stop
                  >
                    <Input
                      v-model="pesquisaFornecedor"
                      placeholder="Pesquisar distribuidor..."
                      class="h-8 shadow-sm text-sm"
                    />
                  </div>
                  <SelectItem
                    v-for="fornecedor in fornecedoresFiltrados"
                    :key="fornecedor.id"
                    :value="String(fornecedor.id)"
                  >
                    {{ fornecedor.tipo }} — {{ fornecedor.nome }}
                  </SelectItem>
                  <div
                    v-if="fornecedoresFiltrados.length === 0"
                    class="py-6 text-center text-sm text-muted-foreground"
                  >
                    Nenhum distribuidor encontrado.
                  </div>
                </SelectContent>
              </Select>
              <div v-if="erros.setorOrigem" class="text-red-500 text-sm mt-1">
                {{ erros.setorOrigem }}
              </div>
            </div>

            <!-- Seta visual -->
            <div class="hidden md:flex items-center pt-3">
              <i class="mdi mdi-arrow-right text-2xl text-muted-foreground"></i>
            </div>

            <!-- Destino (Você) -->
            <div class="flex-shrink-0">
              <label class="text-xs text-muted-foreground block mb-1"
                >Setor Solicitante (Você)</label
              >
              <div
                class="p-2 px-3 bg-muted rounded-lg flex items-center gap-2 border h-10"
              >
                <i class="mdi mdi-map-marker text-primary"></i>
                <span class="font-medium text-sm">{{ setorDestinoNome }}</span>
              </div>
            </div>
          </template>

          <template v-else>
            <!-- Devolução: Origem é Você -->
            <div class="flex-shrink-0">
              <label class="text-xs text-muted-foreground block mb-1"
                >Setor Devolvente (Você - Origem)</label
              >
              <div
                class="p-2 px-3 bg-amber-50 text-amber-900 rounded-lg flex items-center gap-2 border border-amber-200 h-10"
              >
                <i class="mdi mdi-map-marker text-amber-600"></i>
                <span class="font-medium text-sm">{{ setorDestinoNome }}</span>
              </div>
            </div>

            <!-- Seta visual de retorno -->
            <div class="hidden md:flex items-center pt-3">
              <i class="mdi mdi-arrow-right text-2xl text-amber-600"></i>
            </div>

            <!-- Devolução: Destino é o Distribuidor receptor -->
            <div class="flex-grow md:flex-grow-0 md:w-[300px]">
              <Label
                for="setorDestinoDevolucao"
                class="text-xs text-muted-foreground block mb-1"
              >
                Devolver Para (Distribuidor Receptor) <span class="text-danger">*</span>
              </Label>
              <Select
                v-model="form.setorOrigemId"
                @update:modelValue="onSetorOrigemChange"
              >
                <SelectTrigger
                  id="setorDestinoDevolucao"
                  :class="{ 'border-red-500': erros.setorOrigem }"
                >
                  <SelectValue placeholder="Selecione onde devolver" />
                </SelectTrigger>
                <SelectContent>
                  <div
                    class="px-2 py-2 sticky top-0 bg-white border-b z-10"
                    @keydown.stop
                  >
                    <Input
                      v-model="pesquisaFornecedor"
                      placeholder="Pesquisar distribuidor receptor..."
                      class="h-8 shadow-sm text-sm"
                    />
                  </div>
                  <SelectItem
                    v-for="fornecedor in fornecedoresFiltrados"
                    :key="fornecedor.id"
                    :value="String(fornecedor.id)"
                  >
                    {{ fornecedor.tipo }} — {{ fornecedor.nome }}
                  </SelectItem>
                  <div
                    v-if="fornecedoresFiltrados.length === 0"
                    class="py-6 text-center text-sm text-muted-foreground"
                  >
                    Nenhum distribuidor encontrado.
                  </div>
                </SelectContent>
              </Select>
              <div v-if="erros.setorOrigem" class="text-red-500 text-sm mt-1">
                {{ erros.setorOrigem }}
              </div>
            </div>
          </template>
        </div>

        <!-- Observação -->
        <div class="mb-4">
          <Label for="observacao">
            Observação
            <span class="text-muted small">(opcional)</span>
          </Label>
          <Textarea
            id="observacao"
            v-model="form.observacao"
            placeholder="Adicione observações sobre a solicitação..."
            rows="3"
          />
        </div>

        <hr class="my-4" />

        <!-- Seção de Itens -->
        <div class="mb-3">
          <h5 class="mb-1">Itens</h5>
          <p class="text-muted mb-3">
            Selecione os produtos e quantidades para a solicitação.
          </p>

          <div class="row g-3 p-3 border rounded bg-light align-items-end">
            <div class="col-md-5 relative">
              <Label for="produtoSearch">
                Produto
                <span class="text-danger">*</span>
              </Label>
              <div class="relative">
                <Input
                  id="produtoSearch"
                  v-model="produtoSearch"
                  placeholder="Digite para buscar um produto..."
                  :disabled="!form.setorOrigemId"
                  @focus="showProdutoList = true"
                  @input="showProdutoList = true"
                  class="pr-8"
                  :class="{
                    'border-red-500':
                      !itemAtual.produtoId && produtoSearch && !showProdutoList,
                  }"
                  autocomplete="off"
                />
                <i
                  v-if="itemAtual.produtoId"
                  class="mdi mdi-close-circle absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-red-500"
                  @click="limparSelecaoProduto"
                  title="Limpar seleção"
                ></i>
                <i
                  v-else
                  class="mdi mdi-magnify absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none"
                ></i>
              </div>

              <!-- Dropdown List -->
              <div
                v-if="showProdutoList && form.setorOrigemId"
                class="absolute z-[2500] w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto"
              >
                <div v-if="loadingProdutos" class="p-3 text-center text-muted">
                  <span class="spinner-border spinner-border-sm me-2"></span>
                  Carregando...
                </div>
                <ul
                  v-else-if="filteredProdutos.length > 0"
                  class="py-1 m-0 list-none"
                >
                  <li
                    v-for="produto in filteredProdutos"
                    :key="produto.id"
                    class="px-3 py-2 cursor-pointer hover:bg-gray-100 flex flex-col"
                    @click="selecionarProduto(produto)"
                  >
                    <span class="font-medium text-sm">{{ produto.nome }}</span>
                    <span
                      v-if="produto.marca"
                      class="text-xs text-muted-foreground"
                      >{{ produto.marca }}</span
                    >
                  </li>
                </ul>
                <div v-else class="p-3 text-center text-muted small">
                  Nenhum produto encontrado.
                </div>
              </div>

              <!-- Clique fora para fechar (backdrop transparente simples) -->
              <div
                v-if="showProdutoList"
                class="fixed inset-0 z-[2400] bg-transparent"
                @click="showProdutoList = false"
              ></div>
            </div>

            <div class="col-md-2">
              <Label for="produtoQuantidade">
                Quantidade
                <span class="text-danger">*</span>
              </Label>
              <Input
                id="produtoQuantidade"
                type="number"
                step="1"
                min="0"
                v-model.number="itemAtual.quantidade"
                @keydown="(e) => ['e', 'E', '+', '-', '.', ','].includes(e.key) && e.preventDefault()"
                placeholder="Ex: 10"
                class="w-auto min-w-[5rem] px-2"
              />
            </div>

            <div class="col-md-2">
              <Label for="produtoLote">
                Lote <span class="text-muted text-[10px]">(opcional)</span>
              </Label>
              <Input
                id="produtoLote"
                type="text"
                v-model="itemAtual.lote"
                placeholder="Ex: LT-123"
              />
            </div>

            <div class="col-md-3">
              <Button
                variant="default"
                type="button"
                class="w-full"
                @click="adicionarItem"
                :disabled="!podeAdicionarItem"
              >
                <i class="mdi mdi-cart-plus me-1"></i>
                Adicionar
              </Button>
            </div>
          </div>
        </div>

        <!-- Lista de Itens Adicionados -->
        <div v-if="form.itens.length > 0" class="table-responsive mb-4">
          <table class="table table-striped table-hover align-middle mb-0">
            <thead>
              <tr>
                <th class="text-start">Produto</th>
                <th class="text-center">Quantidade</th>
                <th class="text-center" style="width: 80px">Ação</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in form.itens" :key="index">
                <td class="text-start">
                  <strong>{{ item.produtoNome }}</strong>
                  <div class="text-muted small" v-if="item.produtoMarca">
                    {{ item.produtoMarca }}
                  </div>
                </td>
                <td class="text-center">
                  <Badge>{{ item.quantidade }}</Badge>
                </td>
                <td class="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    @click="removerItem(index)"
                    title="Remover item"
                  >
                    <i class="mdi mdi-delete text-red-500"></i>
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="text-center py-4 text-muted">
          <i
            class="mdi mdi-package-variant-closed-remove"
            style="font-size: 2rem"
          ></i>
          <p class="mb-0 mt-2">Nenhum item adicionado</p>
        </div>

        <!-- Footer Actions -->
        <div class="mt-4 d-flex justify-content-between">
          <Button
            variant="outline"
            type="button"
            @click="salvarRascunho"
            :disabled="loading || form.itens.length === 0"
            class="text-amber-600 border-amber-600 hover:bg-amber-50"
          >
            <template v-if="!loadingRascunho">
              <i class="mdi mdi-content-save-outline me-1"></i>
              {{ rascunho ? 'Atualizar Rascunho' : 'Salvar rascunho' }}
            </template>
            <template v-else>
              <span class="spinner-border spinner-border-sm me-1"></span>
              Salvando...
            </template>
          </Button>

          <div class="d-flex gap-2">
            <Button
              variant="outline"
              type="button"
              @click="fecharModal"
              :disabled="loading"
            >
              Fechar
            </Button>
            <Button
              :variant="tipoMovimentacao === 'D' ? 'outline' : 'default'"
              type="submit"
              :disabled="loading || !podeFinalizar"
              :class="tipoMovimentacao === 'D' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''"
            >
              <template v-if="!loadingFinalizar">
                <i :class="tipoMovimentacao === 'D' ? 'mdi mdi-undo-variant me-1' : 'mdi mdi-send me-1'"></i>
                {{ tipoMovimentacao === 'D' ? 'Registrar Devolução' : 'Finalizar e Solicitar' }}
              </template>
              <template v-else>
                <span class="spinner-border spinner-border-sm me-1"></span>
                Enviando...
              </template>
            </Button>
          </div>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script>
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axios from "axios";

export default {
  name: "ModalNovaMovimentacao",
  components: {
    Button,
    Input,
    Label,
    Badge,
    Textarea,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
  },
  emits: ["registrado", "update:open"],
  props: {
    open: {
      type: Boolean,
      default: false,
    },
    setorId: {
      type: [Number, String],
      required: true,
    },
    setorNome: {
      type: String,
      default: "",
    },
    // Rascunho existente para edição
    rascunho: {
      type: Object,
      default: null,
    },
    modoInicial: {
      type: String,
      default: "T", // 'T' = Requisição, 'D' = Devolução
    },
    movimentacaoOrigem: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      tipoMovimentacao: "T", // 'T' = Requisição, 'D' = Devolução
      loading: false,
      loadingRascunho: false,
      loadingFinalizar: false,
      loadingFornecedores: false,
      loadingProdutos: false,
      fornecedoresDisponiveis: [],
      produtosDisponiveis: [],
      form: {
        setorOrigemId: "",
        observacao: "",
        itens: [],
      },
      itemAtual: {
        produtoId: "",
        quantidade: 1,
        lote: "",
      },
      erros: {},
      tipoSetorOrigem: null,
      produtoSearch: "",
      showProdutoList: false,
      pesquisaFornecedor: "",
    };
  },
  computed: {
    setorDestinoNome() {
      return this.setorNome || "Setor atual";
    },
    podeAdicionarItem() {
      return (
        this.itemAtual.produtoId &&
        this.itemAtual.quantidade > 0 &&
        this.form.setorOrigemId
      );
    },
    podeFinalizar() {
      return (
        this.form.setorOrigemId && this.form.itens.length > 0 && !this.loading
      );
    },
    filteredProdutos() {
      if (!this.produtoSearch) {
        // Se vazio e nenhum produto selecionado, mostra todos (ou limita a 20 pra performance)
        return this.produtosDisponiveis.slice(0, 50);
      }
      const term = this.produtoSearch.toLowerCase();
      return this.produtosDisponiveis
        .filter((p) => {
          return (
            (p.nome && p.nome.toLowerCase().includes(term)) ||
            (p.marca && p.marca.toLowerCase().includes(term))
          );
        })
        .slice(0, 50); // Limit results
    },
    fornecedoresFiltrados() {
      const term = this.pesquisaFornecedor.toLowerCase();
      if (!term) return this.fornecedoresDisponiveis;

      return this.fornecedoresDisponiveis.filter((f) => {
        const nome = f.nome || "";
        const tipo = f.tipo || "";
        return (
          nome.toLowerCase().includes(term) || tipo.toLowerCase().includes(term)
        );
      });
    },
  },
  watch: {
    open(newVal) {
      if (newVal) {
        this.tipoMovimentacao = this.modoInicial || "T";
        this.carregarFornecedores().then(() => {
          if (this.rascunho) {
            this.preencherFormComRascunho();
          } else if (this.movimentacaoOrigem) {
            this.preencherComMovimentacaoOrigem();
          } else {
            this.resetForm();
          }
        });
      }
    },
  },
  methods: {
    selecionarProduto(produto) {
      this.itemAtual.produtoId = produto.id;
      this.produtoSearch = produto.nome; // Mostrar nome selecionado
      this.showProdutoList = false;
    },
    limparSelecaoProduto() {
      this.itemAtual.produtoId = "";
      this.produtoSearch = "";
      this.showProdutoList = false;
    },
    async carregarFornecedores() {
      if (!this.setorId) return;

      this.loadingFornecedores = true;
      try {
        const response = await axios.post(
          "/setores/listDistribuidoresParaSetor",
          { setor_id: this.setorId },
          {
            headers: {
              Authorization: "Bearer " + this.$store.getters["auth/getUserToken"],
              "Content-Type": "application/json",
            },
          },
        );

        if (response.data?.status) {
          this.fornecedoresDisponiveis = response.data.data || [];
        } else {
          this.fornecedoresDisponiveis = [];
        }
      } catch (error) {
        console.error("Erro ao carregar distribuidores:", error);
        this.fornecedoresDisponiveis = [];
      } finally {
        this.loadingFornecedores = false;
      }
    },

    async carregarProdutosPorTipo(tipo) {
      if (!tipo) {
        this.produtosDisponiveis = [];
        return;
      }

      this.loadingProdutos = true;
      try {
        const response = await axios.post(
          "/produtos/listByTipo",
          { tipo },
          {
            headers: {
              Authorization: "Bearer " + this.$store.getters["auth/getUserToken"],
              "Content-Type": "application/json",
            },
          },
        );

        if (response.data?.status) {
          this.produtosDisponiveis = response.data.data || [];
        } else {
          this.produtosDisponiveis = [];
        }
      } catch (error) {
        console.error("Erro ao carregar produtos:", error);
        this.produtosDisponiveis = [];
      } finally {
        this.loadingProdutos = false;
      }
    },

    onSetorOrigemChange(value) {
      // Limpar itens ao trocar fornecedor
      this.form.itens = [];
      this.limparSelecaoProduto(); // Limpar seleção atual também

      // Encontrar o tipo do setor selecionado
      const fornecedor = this.fornecedoresDisponiveis.find(
        (f) => String(f.id) === String(value),
      );

      if (fornecedor) {
        this.tipoSetorOrigem = fornecedor.tipo;
        this.carregarProdutosPorTipo(fornecedor.tipo);
      } else {
        this.tipoSetorOrigem = null;
        this.produtosDisponiveis = [];
      }
    },

    adicionarItem() {
      if (!this.podeAdicionarItem) return;

      const produto = this.produtosDisponiveis.find(
        (p) => String(p.id) === String(this.itemAtual.produtoId),
      );

      if (!produto) return;

      // Verificar se já existe
      const existente = this.form.itens.find(
        (item) => String(item.produtoId) === String(this.itemAtual.produtoId),
      );

      if (existente) {
        existente.quantidade += this.itemAtual.quantidade;
        if (this.itemAtual.lote) existente.lote = this.itemAtual.lote;
      } else {
        this.form.itens.push({
          produtoId: produto.id,
          produtoNome: produto.nome,
          produtoMarca: produto.marca,
          quantidade: this.itemAtual.quantidade,
          lote: this.itemAtual.lote || null,
        });
      }

      // Reset item atual
      this.limparSelecaoProduto();
      this.itemAtual.quantidade = 1;
      this.itemAtual.lote = "";
    },

    removerItem(index) {
      this.form.itens.splice(index, 1);
    },

    async salvarRascunho() {
      if (this.rascunho) {
        // Modo edição: atualizar rascunho existente
        await this.atualizarRascunho();
      } else {
        await this.enviarMovimentacao("C"); // C = rascunho novo
      }
    },

    async atualizarRascunho() {
      if (!this.form.setorOrigemId || this.form.itens.length === 0) return;
      this.loadingRascunho = true;
      this.loading = true;
      try {
        const payload = {
          setor_origem_id: parseInt(this.form.setorOrigemId),
          observacao: this.form.observacao || "",
          itens: this.form.itens.map((item) => ({
            produto_id: item.produtoId,
            quantidade_solicitada: item.quantidade,
          })),
        };
        const response = await axios.post(
          `/movimentacao/${this.rascunho.id}/update-rascunho`,
          payload,
          { headers: { Authorization: "Bearer " + this.$store.getters["auth/getUserToken"] } }
        );
        if (response.data?.status) {
          this.$emit("registrado");
          this.fecharModal();
        } else {
          console.error("Erro ao atualizar rascunho:", response.data?.message);
        }
      } catch (error) {
        console.error("Erro ao atualizar rascunho:", error);
      } finally {
        this.loading = false;
        this.loadingRascunho = false;
      }
    },

    async finalizarSolicitacao() {
      await this.enviarMovimentacao("P"); // P = pendente
    },

    async enviarMovimentacao(status) {
      if (!this.form.setorOrigemId || this.form.itens.length === 0) {
        return;
      }

      const isRascunho = status === "C";
      if (isRascunho) {
        this.loadingRascunho = true;
      } else {
        this.loadingFinalizar = true;
      }
      this.loading = true;

      try {
        const isDevolucao = this.tipoMovimentacao === "D";
        const payload = {
          usuario_id: this.$store.state.auth.user?.id,
          setor_origem_id: isDevolucao ? parseInt(this.setorId) : parseInt(this.form.setorOrigemId),
          setor_destino_id: isDevolucao ? parseInt(this.form.setorOrigemId) : parseInt(this.setorId),
          tipo: isDevolucao ? "D" : "T",
          observacao: this.form.observacao || "",
          status_solicitacao: status,
          itens: this.form.itens.map((item) => ({
            produto_id: item.produtoId,
            quantidade_solicitada: item.quantidade,
            lote: item.lote || null,
          })),
        };

        const response = await axios.post("/movimentacao/add", payload, {
          headers: {
            Authorization: "Bearer " + this.$store.getters["auth/getUserToken"],
            "Content-Type": "application/json",
          },
        });

        if (response.data?.status) {
          this.$emit("registrado");
          this.fecharModal();

          // Mostrar toast de sucesso se disponível
          if (this.$toastr?.s) {
            const msg = isRascunho
              ? "Rascunho salvo com sucesso!"
              : "Solicitação enviada com sucesso!";
            this.$toastr.s(msg);
          }
        } else {
          const msg = response.data?.message || "Erro ao criar movimentação";
          if (this.$toastr?.e) {
            this.$toastr.e(msg);
          }
        }
      } catch (error) {
        console.error("Erro ao enviar movimentação:", error);
        const msg =
          error.response?.data?.message || "Erro ao criar movimentação";
        if (this.$toastr?.e) {
          this.$toastr.e(msg);
        }
      } finally {
        this.loading = false;
        this.loadingRascunho = false;
        this.loadingFinalizar = false;
      }
    },

    resetForm() {
      this.form = {
        setorOrigemId: "",
        observacao: "",
        itens: [],
      };
      this.itemAtual = {
        produtoId: "",
        quantidade: 1,
      };
      this.erros = {};
      this.tipoSetorOrigem = null;
      this.produtosDisponiveis = [];
    },

    async preencherFormComRascunho() {
      if (!this.rascunho) return;
      // Definir setor origem
      this.form.setorOrigemId = String(this.rascunho.setor_origem_id || this.rascunho.setorOrigem?.id || "");
      this.form.observacao = this.rascunho.observacao || "";

      // Carregar produtos do tipo do fornecedor
      if (this.form.setorOrigemId) {
        const fornecedor = this.fornecedoresDisponiveis.find(
          (f) => String(f.id) === String(this.form.setorOrigemId)
        );
        if (fornecedor) {
          this.tipoSetorOrigem = fornecedor.tipo;
          await this.carregarProdutosPorTipo(fornecedor.tipo);
        }
      }

      // Popular itens a partir dos itens do rascunho
      this.form.itens = (this.rascunho.itens || []).map((it) => ({
        produtoId: it.produto_id || it.produto?.id,
        produtoNome: it.produto?.nome || it.produto?.nome_completo || `Produto #${it.produto_id}`,
        produtoMarca: it.produto?.marca || "",
        quantidade: it.quantidade_solicitada,
      }));
    },

    async preencherComMovimentacaoOrigem() {
      const mov = this.movimentacaoOrigem;
      if (!mov) return;
      this.tipoMovimentacao = "D";

      // O distribuidor para onde devolveremos é a origem da requisição original
      const distribuidorId = String(mov.setor_origem_id || mov.setorOrigem?.id || "");
      this.form.setorOrigemId = distribuidorId;
      this.form.observacao = `Devolução referente à movimentação #${mov.id}`;

      if (distribuidorId) {
        const fornecedor = this.fornecedoresDisponiveis.find(
          (f) => String(f.id) === distribuidorId
        );
        if (fornecedor) {
          this.tipoSetorOrigem = fornecedor.tipo;
          await this.carregarProdutosPorTipo(fornecedor.tipo);
        }
      }

      this.form.itens = (mov.itens || []).map((it) => {
        let loteNome = "";
        if (it.lote) {
          try {
            const parsed = JSON.parse(it.lote);
            if (Array.isArray(parsed) && parsed[0]?.lote) {
              loteNome = parsed[0].lote;
            } else if (typeof it.lote === "string") {
              loteNome = it.lote;
            }
          } catch (e) {
            loteNome = it.lote;
          }
        }
        return {
          produtoId: it.produto_id || it.produto?.id,
          produtoNome: it.produto?.nome || it.produto?.nome_completo || `Produto #${it.produto_id}`,
          produtoMarca: it.produto?.marca || "",
          quantidade: Number(it.quantidade_liberada || it.quantidade_solicitada || 1),
          lote: loteNome,
        };
      });
    },

    fecharModal() {
      this.$emit("update:open", false);
    },
  },
};
</script>

<style scoped>
.table-responsive {
  border-radius: 0.25rem;
  border: 1px solid #e9ecef;
}

.table {
  margin-bottom: 0;
}
</style>
