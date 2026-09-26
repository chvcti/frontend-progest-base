<template>
  <Dialog :open="open" @update:open="$emit('update:open', $event)">
    <DialogContent class="max-w-6xl max-h-[90vh] overflow-y-auto">
      <DialogHeader class="text-start">
        <DialogTitle class="flex gap-2">
          <i class="mdi mdi-tray-arrow-down text-primary"></i>
          Registrar entrada de estoque
        </DialogTitle>
        <DialogDescription>
          Preencha os dados abaixo para lançar uma nova entrada de produtos na
          unidade selecionada.
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="registrarEntradaLocal" novalidate>
        <div class="row g-3">
          <div class="col-md-4">
            <Label for="entradaNotaFiscal">
              Nota fiscal
              <span class="text-muted small">(opcional)</span>
            </Label>
            <Input
              id="entradaNotaFiscal"
              v-model="form.notaFiscal"
              type="text"
              class="text-uppercase"
              placeholder="Ex: NF-2025/001"
            />
          </div>

          <div class="col-md-8">
            <Label for="entradaFornecedor">
              Fornecedor
              <span class="text-danger">*</span>
            </Label>
            <div class="flex gap-2">
              <div class="flex-1">
                <Select v-model="form.fornecedorId">
                  <SelectTrigger
                    id="entradaFornecedor"
                    :class="{ 'border-red-500': fornecedorErro }"
                  >
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent position="popper" class="!z-[9999] z-[9999] max-h-72">
                    <div
                      class="px-2 py-2 sticky top-0 bg-white border-b z-10"
                      @keydown.stop
                    >
                      <Input
                        v-model="pesquisaFornecedor"
                        placeholder="Pesquisar fornecedor..."
                        class="h-8 shadow-sm text-sm"
                      />
                    </div>
                    <SelectItem
                      v-for="fornecedor in fornecedoresFiltrados"
                      :key="fornecedor.id"
                      :value="String(fornecedor.id)"
                    >
                      {{ fornecedorLabel(fornecedor) }}
                    </SelectItem>
                    <div
                      v-if="fornecedoresFiltrados.length === 0"
                      class="py-6 text-center text-sm text-muted-foreground"
                    >
                      Nenhum fornecedor encontrado.
                    </div>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                size="icon"
                type="button"
                @click="toggleFornecedorForm"
              >
                <i class="mdi mdi-plus"></i>
              </Button>
            </div>
            <div v-if="fornecedorErro" class="text-red-500 text-sm mt-1">
              {{ fornecedorErro }}
            </div>
          </div>
        </div>

        <div v-if="showFornecedorForm" class="mt-3 p-3 border rounded bg-light">
          <h6 class="mb-3 text-primary">Cadastrar fornecedor rapidamente</h6>
          <div class="row g-3">
            <div class="col-md-4">
              <Label for="novoFornecedorNome">
                Razão social / Nome
                <span class="text-danger">*</span>
              </Label>
              <Input
                id="novoFornecedorNome"
                v-model="novoFornecedor.nome"
                type="text"
                class="text-uppercase"
                placeholder="Digite o nome do fornecedor"
              />
            </div>
            <div class="col-md-4">
              <Label for="novoFornecedorTipo"> Tipo de pessoa </Label>
              <Select v-model="novoFornecedor.tipo">
                <SelectTrigger id="novoFornecedorTipo" class="w-full">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="J">Pessoa Jurídica</SelectItem>
                  <SelectItem value="F">Pessoa Física</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="col-md-4">
              <Label for="novoFornecedorDocumento">
                {{ novoFornecedor.tipo === "J" ? "CNPJ" : "CPF" }}
              </Label>
              <Input
                id="novoFornecedorDocumento"
                v-model="novoFornecedor.documento"
                type="text"
                placeholder="Somente números"
                v-mask="mascaraDocumentoFornecedor"
              />
            </div>
            <div class="col-12 d-flex justify-content-end gap-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                @click="cancelarFornecedorForm"
              >
                <i class="mdi mdi-close"></i>
                Cancelar
              </Button>
              <Button
                variant="default"
                size="sm"
                type="button"
                @click="salvarFornecedorInline"
                :disabled="
                  salvandoFornecedorInline ||
                  !novoFornecedor.nome ||
                  !novoFornecedor.documento
                "
              >
                <template v-if="!salvandoFornecedorInline">
                  <i class="mdi mdi-check"></i>
                  <span>Salvar fornecedor</span>
                </template>
                <template v-else>
                  <span
                    class="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  <span>Salvando...</span>
                </template>
              </Button>
            </div>
          </div>
        </div>

        <hr class="my-4" />

        <div class="mb-3">
          <h5 class="mb-1">Produtos da entrada</h5>
          <p class="text-muted mb-3">
            Selecione o produto e preencha os dados do lote, quantidade e datas.
          </p>

          <div class="row g-3 p-3 border rounded bg-light">
            <div class="col-md-4">
              <Label for="produtoSelect">
                Produto
                <span class="text-danger">*</span>
              </Label>
              <div class="flex gap-2">
                <div class="flex-1 min-w-0">
                  <Select v-model="produtoSelecionadoId">
                    <SelectTrigger
                      id="produtoSelect"
                      :disabled="produtosDisponiveis.length === 0"
                      class="w-full"
                    >
                      <SelectValue placeholder="Selecione um produto" class="truncate" />
                    </SelectTrigger>
                    <SelectContent position="popper" class="!z-[9999] z-[9999] max-h-72">
                      <div
                        class="px-2 py-2 sticky top-0 bg-white border-b z-10"
                        @keydown.stop
                      >
                        <Input
                          v-model="pesquisaProduto"
                          placeholder="Pesquisar produto..."
                          class="h-8 shadow-sm text-sm"
                        />
                      </div>
                      <SelectItem
                        v-for="produto in produtosFiltrados"
                        :key="produto.id"
                        :value="String(produto.id)"
                      >
                        {{ produtoLabel(produto) }}
                      </SelectItem>
                      <div
                        v-if="produtosFiltrados.length === 0"
                        class="py-6 text-center text-sm text-muted-foreground"
                      >
                        Nenhum produto encontrado.
                      </div>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  @click="toggleProdutoForm"
                  title="Cadastrar novo produto"
                  class="shrink-0"
                >
                  <i class="mdi mdi-plus"></i>
                </Button>
              </div>
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
                placeholder="Ex: 100"
                class="w-full px-3"
              />
            </div>

            <!-- Bloco de valor (opcional) -->
            <div class="col-md-3">
              <Label>Valor <span class="text-muted small">(opcional)</span></Label>
              <div class="flex flex-col gap-1.5">
                <!-- Toggle tipo de valor -->
                <div class="flex rounded-lg overflow-hidden border border-slate-200 text-xs font-medium">
                  <button
                    type="button"
                    @click="itemAtual.tipoValor = 'unitario'"
                    :class="[
                      'flex-1 py-1.5 px-2 transition-colors',
                      itemAtual.tipoValor === 'unitario'
                        ? 'bg-primary text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50'
                    ]"
                  >
                    Por unidade
                  </button>
                  <button
                    type="button"
                    @click="itemAtual.tipoValor = 'total'"
                    :class="[
                      'flex-1 py-1.5 px-2 transition-colors',
                      itemAtual.tipoValor === 'total'
                        ? 'bg-primary text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50'
                    ]"
                  >
                    Valor total
                  </button>
                </div>
                <!-- Campo de valor -->
                <div class="flex items-center">
                  <span class="inline-flex items-center px-3 h-10 rounded-l-md border border-r-0 border-slate-200 bg-slate-50 text-slate-500 text-sm select-none font-medium">
                    R$
                  </span>
                  <Input
                    class="rounded-l-none h-10"
                    id="produtoValor"
                    placeholder="0,00"
                    step="0.01"
                    type="number"
                    min="0"
                    v-model="itemAtual.valor"
                  />
                </div>
                <!-- Preview do valor unitario quando modo total -->
                <div
                  v-if="itemAtual.tipoValor === 'total' && itemAtual.valor && itemAtual.quantidade > 0"
                  class="text-[11px] text-slate-500"
                >
                  Unitário ≈ R$ {{ (parseFloat(itemAtual.valor) / itemAtual.quantidade).toFixed(4) }}
                </div>
              </div>
            </div>

            <div class="col-md-2">
              <Label for="produtoLote">
                Lote
                <span class="text-danger">*</span>
              </Label>
              <Input
                id="produtoLote"
                type="text"
                class="text-uppercase"
                maxlength="50"
                v-model="itemAtual.lote"
                placeholder="Ex: LOTE123"
              />
            </div>

            <div class="col-md-2">
              <Label for="produtoDataFabricacao">Data fabricação <span class="text-muted small">(opcional)</span></Label>
              <Input
                id="produtoDataFabricacao"
                type="date"
                v-model="itemAtual.data_fabricacao"
                :max="dataHoje"
              />
            </div>

            <div class="col-md-2">
              <Label for="produtoDataVencimento">
                Data vencimento
                <span class="text-danger">*</span>
              </Label>
              <Input
                id="produtoDataVencimento"
                type="date"
                v-model="itemAtual.data_vencimento"
                :min="dataAmanha"
              />
            </div>

            <div class="col-12 d-flex justify-content-end">
              <Button variant="default" type="button" @click="adicionarProduto">
                <i class="mdi mdi-cart-plus"></i>
                <span>Adicionar à lista</span>
              </Button>
            </div>
          </div>
        </div>

        <div
          v-if="showProdutoForm"
          class="mt-3 mb-4 p-3 border rounded bg-light"
        >
          <h6 class="mb-3 text-primary">Cadastrar produto rapidamente</h6>
          <div class="row g-3">
            <div class="col-lg-4 col-md-6">
              <Label for="novoProdutoNome">
                Nome do produto
                <span class="text-danger">*</span>
              </Label>
              <Input
                id="novoProdutoNome"
                v-model="novoProduto.nome"
                type="text"
                class="text-uppercase"
                placeholder="Ex: DIPIRONA 500MG"
              />
            </div>
            <div class="col-lg-4 col-md-6">
              <Label for="novoProdutoGrupo"> Grupo do produto </Label>
              <div class="flex gap-2">
                <div class="flex-1">
                  <Select v-model="novoProduto.grupo_produto_id">
                    <SelectTrigger id="novoProdutoGrupo">
                      <SelectValue placeholder="Selecionar grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        v-for="grupo in gruposDisponiveis"
                        :key="grupo.id"
                        :value="String(grupo.id)"
                      >
                        {{ grupo.nome }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  @click="toggleGrupoProdutoForm"
                  title="Cadastrar novo grupo"
                >
                  <i class="mdi mdi-plus"></i>
                </Button>
              </div>
            </div>
            <div class="col-lg-4 col-md-6">
              <Label for="novoProdutoUnidade"> Unidade de medida </Label>
              <div class="flex gap-2">
                <div class="flex-1">
                  <Select v-model="novoProduto.unidade_medida_id">
                    <SelectTrigger id="novoProdutoUnidade" class="w-full">
                      <SelectValue placeholder="Selecionar unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        v-for="unidade in unidadesMedidaDisponiveis"
                        :key="unidade.id"
                        :value="String(unidade.id)"
                      >
                        {{ unidade.nome }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  type="button"
                  @click="toggleUnidadeMedidaForm"
                  title="Cadastrar nova unidade"
                >
                  <i class="mdi mdi-plus"></i>
                </Button>
              </div>
            </div>
            <div class="col-md-3">
              <Label for="novoProdutoStatus"> Status </Label>
              <Select v-model="novoProduto.status">
                <SelectTrigger id="novoProdutoStatus" class="w-full">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Ativo</SelectItem>
                  <SelectItem value="I">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="col-md-3">
              <Label for="novoProdutoCodigoSimpas"> Código SIMPAS </Label>
              <Input
                id="novoProdutoCodigoSimpas"
                v-model="novoProduto.codigo_simpas"
                type="text"
                class="text-uppercase"
                placeholder="Ex: ABC-123.45"
              />
            </div>
            <div class="col-md-3">
              <Label for="novoProdutoCodigoBarras"> Código de barras </Label>
              <Input
                id="novoProdutoCodigoBarras"
                v-model="novoProduto.codigo_barras"
                type="text"
                placeholder="Ex: 7891234567890"
              />
            </div>
            <div class="col-md-3">
              <Label for="novoProdutoMarca"> Marca </Label>
              <Input
                id="novoProdutoMarca"
                v-model="novoProduto.marca"
                type="text"
                class="text-uppercase"
                placeholder="Ex: EMS"
              />
            </div>
            <div v-if="showGrupoProdutoForm" class="col-12">
              <div class="p-3 border rounded bg-white">
                <div class="row g-3 align-items-end">
                  <div class="col-md-6">
                    <Label class="text-sm" for="novoGrupoProdutoNome">
                      Nome do grupo
                      <span class="text-danger">*</span>
                    </Label>
                    <Input
                      id="novoGrupoProdutoNome"
                      v-model="novoGrupoProduto.nome"
                      type="text"
                      class="text-uppercase"
                      placeholder="Ex: ANALGÉSICOS"
                    />
                  </div>
                  <div class="col-md-3">
                    <Label class="text-sm" for="novoGrupoProdutoTipo">
                      Tipo
                    </Label>
                    <Select v-model="novoGrupoProduto.tipo">
                      <SelectTrigger id="novoGrupoProdutoTipo" class="w-full">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Material">Material</SelectItem>
                        <SelectItem value="Medicamento">Medicamento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div class="col-md-3 d-flex justify-content-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      @click="cancelarGrupoProdutoForm"
                    >
                      <i class="mdi mdi-close"></i>
                      Cancelar
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      type="button"
                      @click="salvarGrupoProdutoInline"
                      :disabled="
                        salvandoGrupoProdutoInline || !novoGrupoProduto.nome
                      "
                    >
                      <template v-if="!salvandoGrupoProdutoInline">
                        <i class="mdi mdi-check"></i>
                        <span>Salvar grupo</span>
                      </template>
                      <template v-else>
                        <span
                          class="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        <span>Salvando...</span>
                      </template>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div v-if="showUnidadeMedidaForm" class="col-12">
              <div class="p-3 border rounded bg-white">
                <div class="row g-3 align-items-end">
                  <div class="col-md-4">
                    <Label class="text-sm" for="novaUnidadeMedidaNome">
                      Nome da unidade
                      <span class="text-danger">*</span>
                    </Label>
                    <Input
                      id="novaUnidadeMedidaNome"
                      v-model="novaUnidadeMedida.nome"
                      type="text"
                      class="text-uppercase"
                      placeholder="Ex: CAIXA"
                    />
                  </div>
                  <div class="col-md-3">
                    <Label class="text-sm" for="novaUnidadeMedidaQtd">
                      Qtd.
                      <span class="text-danger">*</span>
                    </Label>
                    <Input
                      id="novaUnidadeMedidaQtd"
                      v-model="novaUnidadeMedida.quantidade_unidade_minima"
                      type="number"
                      step="0.01"
                      placeholder="Ex: 1"
                    />
                  </div>
                  <div class="col-md-5 d-flex justify-content-end gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      @click="cancelarUnidadeMedidaForm"
                    >
                      <i class="mdi mdi-close"></i>
                      Cancelar
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      type="button"
                      @click="salvarUnidadeMedidaInline"
                      :disabled="
                        salvandoUnidadeMedidaInline || !novaUnidadeMedida.nome
                      "
                    >
                      <template v-if="!salvandoUnidadeMedidaInline">
                        <i class="mdi mdi-check"></i>
                        <span>Salvar unidade</span>
                      </template>
                      <template v-else>
                        <span
                          class="spinner-border spinner-border-sm"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        <span>Salvando...</span>
                      </template>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-12 d-flex justify-content-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                type="button"
                @click="cancelarProdutoForm"
              >
                <i class="mdi mdi-close"></i>
                Cancelar
              </Button>
              <Button
                variant="default"
                size="sm"
                type="button"
                @click="salvarProdutoInline"
                :disabled="
                  salvandoProdutoInline ||
                  !novoProduto.nome ||
                  !novoProduto.unidade_medida_id
                "
              >
                <template v-if="!salvandoProdutoInline">
                  <i class="mdi mdi-check"></i>
                  <span>Salvar produto</span>
                </template>
                <template v-else>
                  <span
                    class="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  <span>Salvando...</span>
                </template>
              </Button>
            </div>
          </div>
        </div>

        <div v-if="form.itens.length > 0" class="table-responsive">
          <table class="table table-striped table-hover align-middle">
            <thead>
              <tr>
                <th class="text-start">Produto</th>
                <th class="text-center">Quantidade</th>
                <th class="text-center">Valor Unit.</th>
                <th class="text-center">Lote</th>
                <th class="text-center">Data fabricação</th>
                <th class="text-center">Data vencimento</th>
                <th class="text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in form.itens" :key="item.localId">
                <td class="text-start">
                  <strong>{{ item.produtoNome }}</strong>
                  <div class="text-muted small" v-if="item.unidadeMedidaNome">
                    {{ item.unidadeMedidaNome }}
                  </div>
                </td>
                <td class="text-center">
                  <span class="badge bg-primary">{{ item.quantidade }}</span>
                </td>
                <td class="text-center">
                  <small v-if="item.valor_unitario != null" class="text-success fw-semibold">
                    R$ {{ parseFloat(item.valor_unitario).toFixed(2) }}
                  </small>
                  <small v-else class="text-muted">-</small>
                </td>
                <td class="text-center">
                  <code class="text-dark">{{ item.lote }}</code>
                </td>
                <td class="text-center">
                  <small>{{ formatarData(item.data_fabricacao) || "-" }}</small>
                </td>
                <td class="text-center">
                  <small>{{ formatarData(item.data_vencimento) }}</small>
                </td>
                <td class="text-center">
                  <div class="d-flex gap-1 justify-content-center">
                    <Button
                      variant="outline"
                      size="icon"
                      type="button"
                      @click="editarProduto(item)"
                      title="Editar produto"
                    >
                      <i class="mdi mdi-pencil"></i>
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      type="button"
                      @click="removerProduto(item.localId)"
                      title="Remover produto"
                    >
                      <i class="mdi mdi-delete"></i>
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <Alert v-else class="flex">
          <i class="mdi mdi-information-outline h-4 w-4"></i>
          <AlertDescription>
            Inclua ao menos um produto para registrar a entrada.
          </AlertDescription>
        </Alert>

        <div class="mt-4 d-flex justify-content-end gap-2">
          <Button
            variant="outline"
            type="button"
            @click="fecharModal"
            :disabled="loading"
          >
            <i class="mdi mdi-close-thick me-2"></i>
            Cancelar
          </Button>
          <Button
            variant="default"
            type="submit"
            :disabled="loading || !podeSalvar"
          >
            <template v-if="!loading">
              <i class="mdi mdi-check-bold"></i>
              <span>Registrar entrada</span>
            </template>
            <template v-else>
              <span
                class="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              ></span>
              <span>Registrando...</span>
            </template>
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script>
import cadFornecedores from "@/functions/cad_fornecedores.js";
import cadProdutos from "@/functions/cad_produtos.js";
import cadUnidadesMedida from "@/functions/cad_unidades_medida.js";
import cadGrupoProduto from "@/functions/cad_grupo_produto.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default {
  name: "ModalEntradaEstoque",
  components: {
    Button,
    Input,
    Label,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Alert,
    AlertDescription,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  },
  emits: ["registrado", "update:open"],
  props: {
    open: {
      type: Boolean,
      default: false,
    },
    unidade: {
      type: Object,
      default: () => ({}),
    },
    setorTipo: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      loading: false,
      form: {
        notaFiscal: "",
        fornecedorId: "",
        itens: [],
      },
      showFornecedorForm: false,
      novoFornecedor: {
        nome: "",
        documento: "",
        tipo: "J",
      },
      fornecedoresCustom: [],
      fornecedorErro: "",
      showProdutoForm: false,
      novoProduto: {
        nome: "",
        unidade_medida_id: "",
        status: "A",
        grupo_produto_id: "",
        codigo_simpas: "",
        marca: "",
        codigo_barras: "",
      },
      showGrupoProdutoForm: false,
      novoGrupoProduto: {
        nome: "",
        tipo: "Material",
      },
      showUnidadeMedidaForm: false,
      novaUnidadeMedida: {
        nome: "",
        quantidade_unidade_minima: 1,
      },
      produtosCustom: [],
      gruposCustom: [],
      produtoSelecionadoId: "",
      itemAtual: {
        quantidade: 1,
        lote: "",
        data_fabricacao: "",
        data_vencimento: "",
        tipoValor: "unitario", // 'unitario' ou 'total'
        valor: "",            // valor digitado pelo usuário
      },
      salvandoFornecedorInline: false,
      salvandoProdutoInline: false,
      salvandoGrupoProdutoInline: false,
      salvandoUnidadeMedidaInline: false,
      pesquisaFornecedor: "",
      pesquisaProduto: "",
    };
  },
  computed: {
    fornecedoresDisponiveis() {
      const base = this.normalizarLista(this.$store.state.listFornecedores)
        .filter(f => f.status === 'A' || f.status === 'Ativo' || f.id == this.localData?.fornecedor_id);
      const custom = this.fornecedoresCustom.filter(
        (item) => !base.some((baseItem) => baseItem.id === item.id),
      );
      return [...base, ...custom];
    },
    produtosDisponiveis() {
      let base = this.normalizarLista(this.$store.state.listProdutos)
        .filter(p => p.status === 'A' || p.status === 'Ativo' || this.localData?.itens?.some(i => i.produto_id == p.id));

      // Filtrar por tipo de grupo se setorTipo for restritivo ('Medicamento' ou 'Material')
      // Setores do tipo 'Ambos' (como a CAF) recebem tanto medicamentos quanto materiais
      const tipoSetor = (this.setorTipo || "").trim().toLowerCase();
      if (tipoSetor && tipoSetor !== "ambos" && tipoSetor !== "geral" && tipoSetor !== "todos") {
        const gruposDoTipo = this.normalizarLista(
          this.$store.state.listGrupoProdutos,
        )
          .filter((grupo) => (grupo.tipo || "").toLowerCase() === tipoSetor)
          .map((grupo) => grupo.id);

        base = base.filter((produto) =>
          gruposDoTipo.includes(produto.grupo_produto_id),
        );
      }

      const custom = this.produtosCustom.filter(
        (item) => !base.some((baseItem) => baseItem.id === item.id),
      );
      return [...base, ...custom];
    },
    fornecedoresFiltrados() {
      const term = this.pesquisaFornecedor.toLowerCase();
      if (!term) return this.fornecedoresDisponiveis;

      return this.fornecedoresDisponiveis.filter((f) =>
        this.fornecedorLabel(f).toLowerCase().includes(term),
      );
    },
    produtosFiltrados() {
      const term = this.pesquisaProduto.toLowerCase();
      if (!term) return this.produtosDisponiveis;

      return this.produtosDisponiveis.filter((p) =>
        this.produtoLabel(p).toLowerCase().includes(term),
      );
    },
    gruposDisponiveis() {
      let base = this.normalizarLista(this.$store.state.listGrupoProdutos);
      const tipoSetor = (this.setorTipo || "").trim().toLowerCase();
      if (tipoSetor && tipoSetor !== "ambos" && tipoSetor !== "geral" && tipoSetor !== "todos") {
        base = base.filter((g) => (g.tipo || "").toLowerCase() === tipoSetor);
      }
      const custom = this.gruposCustom.filter(
        (item) => !base.some((baseItem) => baseItem.id === item.id),
      );
      return [...base, ...custom];
    },
    unidadesMedidaDisponiveis() {
      return this.normalizarLista(this.$store.state.listUnidadesMedida);
    },
    mascaraDocumentoFornecedor() {
      return this.novoFornecedor.tipo === "J"
        ? "##.###.###/####-##"
        : "###.###.###-##";
    },
    podeSalvar() {
      return (
        !this.loading && this.form.fornecedorId && this.form.itens.length > 0
      );
    },
    dataHoje() {
      return new Date().toISOString().split("T")[0];
    },
    dataAmanha() {
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);
      return amanha.toISOString().split("T")[0];
    },
  },
  watch: {
    open(value) {
      if (value) {
        this.ensureDadosDependencias();
      }
    },
    "form.fornecedorId"(value) {
      if (value) {
        this.fornecedorErro = "";
      }
    },
    "novoFornecedor.tipo"() {
      this.novoFornecedor.documento = "";
    },
  },
  mounted() {
    this.ensureDadosDependencias();
  },
  beforeUnmount() {
    // Não necessário com Dialog do shadcn
  },
  methods: {
    ensureDadosDependencias() {
      const produtosNoStore = this.normalizarLista(this.$store.state.listProdutos);
      const fornecedoresNoStore = this.normalizarLista(this.$store.state.listFornecedores);
      const unidadesNoStore = this.normalizarLista(this.$store.state.listUnidadesMedida);
      const gruposNoStore = this.normalizarLista(this.$store.state.listGrupoProdutos);

      if (fornecedoresNoStore.length === 0) {
        cadFornecedores.listAll(this);
      }
      if (produtosNoStore.length === 0) {
        cadProdutos.listAll(this);
      }
      if (unidadesNoStore.length === 0) {
        cadUnidadesMedida.listAll(this);
      }
      if (gruposNoStore.length === 0) {
        cadGrupoProduto.listAll(this);
      }
    },
    registrarEventosModal() {
      // Não necessário com Dialog do shadcn
    },
    removerEventosModal() {
      // Não necessário com Dialog do shadcn
    },
    handleShowModal() {
      this.ensureDadosDependencias();
    },
    normalizarLista(lista) {
      if (!lista) return [];
      if (Array.isArray(lista)) return lista;
      if (lista.data && Array.isArray(lista.data)) return lista.data;
      return [];
    },
    fornecedorLabel(fornecedor) {
      if (!fornecedor) return "-";
      const nome =
        fornecedor.razao_social_nome ||
        fornecedor.razao_social ||
        fornecedor.nome;
      const doc =
        fornecedor.documento_formatado ||
        fornecedor.cnpj ||
        fornecedor.cpf ||
        fornecedor.documento;
      return doc ? `${nome} • ${doc}` : nome;
    },
    produtoLabel(produto) {
      if (!produto) return "-";
      const unidade =
        produto.unidade_medida?.nome || produto.unidade_medida_nome;
      return unidade ? `${produto.nome} (${unidade})` : produto.nome;
    },
    toggleFornecedorForm() {
      this.showFornecedorForm = !this.showFornecedorForm;
      if (this.showFornecedorForm) {
        this.novoFornecedor = {
          nome: "",
          documento: "",
          tipo: "J",
        };
      }
    },
    cancelarFornecedorForm() {
      this.showFornecedorForm = false;
      this.novoFornecedor = {
        nome: "",
        documento: "",
        tipo: "J",
      };
    },
    async salvarFornecedorInline() {
      if (this.salvandoFornecedorInline) return;

      if (!this.novoFornecedor.nome) {
        this.notificar("Informe o nome do fornecedor", "error");
        return;
      }

      const documentoNumerico = (this.novoFornecedor.documento || "").replace(
        /\D/g,
        "",
      );

      const isPessoaJuridica = this.novoFornecedor.tipo === "J";
      const documentoValido = isPessoaJuridica
        ? documentoNumerico.length === 14
        : documentoNumerico.length === 11;

      if (!documentoValido) {
        const mensagem = isPessoaJuridica
          ? "CNPJ deve ter 14 dígitos"
          : "CPF deve ter 11 dígitos";
        this.notificar(mensagem, "error");
        return;
      }

      const payload = {
        fornecedor: {
          razao_social_nome: this.novoFornecedor.nome,
          tipo_pessoa: this.novoFornecedor.tipo,
          status: "A",
          cnpj: isPessoaJuridica ? documentoNumerico : null,
          cpf: !isPessoaJuridica ? documentoNumerico : null,
        },
      };

      this.salvandoFornecedorInline = true;

      try {
        const response = await this.$axios.post("/fornecedores/add", payload, {
          headers: {
            Authorization: "Bearer " + this.$store.getters.getUserToken,
          },
        });

        if (response.data?.status && response.data.data?.id) {
          const fornecedor = response.data.data;
          this.fornecedoresCustom = [
            ...this.fornecedoresCustom.filter((f) => f.id !== fornecedor.id),
            fornecedor,
          ];
          this.form.fornecedorId = fornecedor.id;
          this.notificar("Fornecedor cadastrado com sucesso", "success");
          this.showFornecedorForm = false;
          this.novoFornecedor = {
            nome: "",
            documento: "",
            tipo: "J",
          };
          cadFornecedores.listAll(this);
        } else {
          const mensagem =
            response.data?.message ||
            "Não foi possível cadastrar o fornecedor. Tente novamente.";
          this.notificar(mensagem, "error");
        }
      } catch (error) {
        const mensagem =
          error.response?.data?.message ||
          error.response?.data?.erros?.[0] ||
          "Erro ao cadastrar fornecedor. Verifique os dados e tente novamente.";
        this.notificar(mensagem, "error");
        console.error("Erro ao cadastrar fornecedor inline", error);
      } finally {
        this.salvandoFornecedorInline = false;
      }
    },
    toggleProdutoForm() {
      this.showProdutoForm = !this.showProdutoForm;
      if (this.showProdutoForm) {
        this.novoProduto = {
          nome: "",
          unidade_medida_id: "",
          status: "A",
          grupo_produto_id: "",
          codigo_simpas: "",
          marca: "",
          codigo_barras: "",
        };
        this.showGrupoProdutoForm = false;
        this.novoGrupoProduto = {
          nome: "",
          tipo: "Material",
        };
        this.showUnidadeMedidaForm = false;
        this.novaUnidadeMedida = { nome: "" };
      }
    },
    toggleGrupoProdutoForm() {
      this.showGrupoProdutoForm = !this.showGrupoProdutoForm;
      if (this.showGrupoProdutoForm) {
        this.novoGrupoProduto = {
          nome: "",
          tipo: "Material",
        };
      }
    },
    cancelarProdutoForm() {
      this.showProdutoForm = false;
      this.novoProduto = {
        nome: "",
        unidade_medida_id: "",
        status: "A",
        grupo_produto_id: "",
        codigo_simpas: "",
        marca: "",
        codigo_barras: "",
      };
      this.cancelarGrupoProdutoForm();
      this.cancelarUnidadeMedidaForm();
    },
    cancelarGrupoProdutoForm() {
      this.showGrupoProdutoForm = false;
      this.novoGrupoProduto = {
        nome: "",
        tipo: "Material",
      };
    },
    async salvarGrupoProdutoInline() {
      if (this.salvandoGrupoProdutoInline) return;

      if (!this.novoGrupoProduto.nome) {
        this.notificar("Informe o nome do grupo", "error");
        return;
      }

      const payload = {
        grupoProduto: {
          nome: this.novoGrupoProduto.nome,
          tipo: this.novoGrupoProduto.tipo || "Material",
          status: "A",
        },
      };

      this.salvandoGrupoProdutoInline = true;

      try {
        const response = await this.$axios.post("/grupoProduto/add", payload, {
          headers: {
            Authorization: "Bearer " + this.$store.getters.getUserToken,
            "Content-Type": "application/json",
          },
        });

        if (response.data?.status && response.data.data?.id) {
          const grupo = response.data.data;
          this.gruposCustom = [
            ...this.gruposCustom.filter((g) => g.id !== grupo.id),
            grupo,
          ];
          this.novoProduto.grupo_produto_id = grupo.id;
          this.notificar("Grupo de produto cadastrado com sucesso", "success");
          cadGrupoProduto.listAll(this);
          this.cancelarGrupoProdutoForm();
        } else {
          const mensagem =
            response.data?.message ||
            "Não foi possível cadastrar o grupo. Tente novamente.";
          this.notificar(mensagem, "error");
        }
      } catch (error) {
        const mensagem =
          error.response?.data?.message ||
          "Erro ao cadastrar grupo de produto. Verifique os dados e tente novamente.";
        this.notificar(mensagem, "error");
        console.error("Erro ao cadastrar grupo de produto inline", error);
      } finally {
        this.salvandoGrupoProdutoInline = false;
      }
    },
    toggleUnidadeMedidaForm() {
      this.showUnidadeMedidaForm = !this.showUnidadeMedidaForm;
      if (this.showUnidadeMedidaForm) {
        this.novaUnidadeMedida = { nome: "", quantidade_unidade_minima: 1 };
      }
    },
    cancelarUnidadeMedidaForm() {
      this.showUnidadeMedidaForm = false;
      this.novaUnidadeMedida = { nome: "", quantidade_unidade_minima: 1 };
    },
    async salvarUnidadeMedidaInline() {
      if (this.salvandoUnidadeMedidaInline) return;

      if (!this.novaUnidadeMedida.nome || !this.novaUnidadeMedida.quantidade_unidade_minima) {
        this.notificar("Informe o nome e a quantidade da unidade", "error");
        return;
      }

      const payload = {
        unidadeMedida: {
          nome: this.novaUnidadeMedida.nome,
          quantidade_unidade_minima: parseFloat(this.novaUnidadeMedida.quantidade_unidade_minima),
          status: "A",
        },
      };

      this.salvandoUnidadeMedidaInline = true;

      try {
        const response = await this.$axios.post("/unidadeMedida/add", payload, {
          headers: {
            Authorization: "Bearer " + this.$store.getters.getUserToken,
            "Content-Type": "application/json",
          },
        });

        if (response.data?.status && response.data.data?.id) {
          const unidade = response.data.data;
          this.novoProduto.unidade_medida_id = unidade.id;
          this.notificar("Unidade de medida cadastrada com sucesso", "success");
          cadUnidadesMedida.listAll(this);
          this.cancelarUnidadeMedidaForm();
        } else {
          this.notificar("Não foi possível cadastrar a unidade.", "error");
        }
      } catch (error) {
        this.notificar("Erro ao cadastrar unidade de medida.", "error");
        console.error("Erro ao cadastrar unidade inline", error);
      } finally {
        this.salvandoUnidadeMedidaInline = false;
      }
    },
    async salvarProdutoInline() {
      if (this.salvandoProdutoInline) return;

      if (!this.novoProduto.nome) {
        this.notificar("Informe o nome do produto", "error");
        return;
      }

      if (!this.novoProduto.unidade_medida_id) {
        this.notificar("Selecione uma unidade de medida", "error");
        return;
      }

      const payload = {
        produto: {
          nome: this.novoProduto.nome,
          unidade_medida_id: this.novoProduto.unidade_medida_id,
          status: this.novoProduto.status || "A",
          grupo_produto_id: this.novoProduto.grupo_produto_id || null,
          codigo_simpas: this.novoProduto.codigo_simpas || "",
          codigo_barras: this.novoProduto.codigo_barras || "",
          marca: this.novoProduto.marca || "",
        },
      };

      this.salvandoProdutoInline = true;

      try {
        const response = await this.$axios.post("/produtos/add", payload, {
          headers: {
            Authorization: "Bearer " + this.$store.getters.getUserToken,
            "Content-Type": "application/json",
          },
        });

        if (response.data?.status && response.data.data?.id) {
          const produto = response.data.data;
          this.produtosCustom = [
            ...this.produtosCustom.filter((p) => p.id !== produto.id),
            produto,
          ];
          this.produtoSelecionadoId = produto.id;
          this.notificar("Produto cadastrado com sucesso", "success");
          this.showProdutoForm = false;
          this.showGrupoProdutoForm = false;
          this.novoProduto = {
            nome: "",
            unidade_medida_id: "",
            status: "A",
            grupo_produto_id: "",
            codigo_simpas: "",
            marca: "",
            codigo_barras: "",
          };
          cadProdutos.listAll(this);
        } else {
          const mensagem =
            response.data?.message ||
            "Não foi possível cadastrar o produto. Tente novamente.";
          this.notificar(mensagem, "error");
        }
      } catch (error) {
        const mensagem =
          error.response?.data?.message ||
          "Erro ao cadastrar produto. Verifique os dados e tente novamente.";
        this.notificar(mensagem, "error");
        console.error("Erro ao cadastrar produto inline", error);
      } finally {
        this.salvandoProdutoInline = false;
      }
    },
    adicionarProduto() {
      if (!this.produtoSelecionadoId) {
        this.notificar("Selecione um produto", "error");
        return;
      }
      if (!this.itemAtual.quantidade || this.itemAtual.quantidade <= 0) {
        this.notificar("Informe uma quantidade válida", "error");
        return;
      }
      if (!this.itemAtual.lote || this.itemAtual.lote.trim() === "") {
        this.notificar("Informe o lote do produto", "error");
        return;
      }
      if (
        !this.itemAtual.data_vencimento ||
        this.itemAtual.data_vencimento === ""
      ) {
        this.notificar("Informe a data de vencimento", "error");
        return;
      }

      // Validar data de vencimento deve ser futura
      const dataVenc = new Date(this.itemAtual.data_vencimento);
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      if (dataVenc <= hoje) {
        this.notificar(
          "A data de vencimento deve ser posterior à data atual",
          "error",
        );
        return;
      }

      // Validar data de fabricação não pode ser futura (se informada)
      if (this.itemAtual.data_fabricacao) {
        const dataFab = new Date(this.itemAtual.data_fabricacao);
        if (dataFab > hoje) {
          this.notificar("A data de fabricação não pode ser futura", "error");
          return;
        }
      }

      const produto = this.produtosDisponiveis.find(
        (item) => String(item.id) === String(this.produtoSelecionadoId),
      );

      if (!produto) {
        this.notificar("Produto não encontrado", "error");
        return;
      }

      // Calcular valor_unitario
      let valorUnitario = null;
      if (this.itemAtual.valor !== '' && this.itemAtual.valor !== null && !isNaN(parseFloat(this.itemAtual.valor))) {
        const v = parseFloat(this.itemAtual.valor);
        if (this.itemAtual.tipoValor === 'total') {
          valorUnitario = this.itemAtual.quantidade > 0 ? parseFloat((v / this.itemAtual.quantidade).toFixed(4)) : null;
        } else {
          valorUnitario = parseFloat(v.toFixed(4));
        }
      }

      const item = {
        localId: `item-${Date.now()}-${Math.random()}`,
        produto_id: produto.id,
        produtoNome: produto.nome,
        quantidade: this.itemAtual.quantidade,
        valor_unitario: valorUnitario,
        lote: this.itemAtual.lote.trim().toUpperCase(),
        data_vencimento: this.itemAtual.data_vencimento,
        data_fabricacao: this.itemAtual.data_fabricacao || null,
        unidadeMedidaId:
          produto.unidade_medida?.id || produto.unidade_medida_id || null,
        unidadeMedidaNome:
          produto.unidade_medida?.nome || produto.unidade_medida_nome || "",
      };

      this.form.itens.push(item);

      // Resetar campos
      this.produtoSelecionadoId = "";
      this.itemAtual = {
        quantidade: 1,
        lote: "",
        data_fabricacao: "",
        data_vencimento: "",
        tipoValor: "unitario",
        valor: "",
      };

      this.notificar("Produto adicionado à entrada", "success");
    },
    removerProduto(localId) {
      this.form.itens = this.form.itens.filter(
        (item) => item.localId !== localId,
      );
    },
    editarProduto(item) {
      // Preencher os campos do formulário com os dados do item para edição
      this.produtoSelecionadoId = item.produto_id ? String(item.produto_id) : "";
      this.itemAtual = {
        quantidade: item.quantidade,
        lote: item.lote,
        data_fabricacao: item.data_fabricacao || "",
        data_vencimento: item.data_vencimento,
        tipoValor: "unitario",
        valor: item.valor_unitario != null ? String(item.valor_unitario) : "",
      };

      // Remover o item da lista (será adicionado novamente quando salvar)
      this.removerProduto(item.localId);

      // Scroll para o topo do formulário para facilitar a edição
      const formSection = document.querySelector(".bg-light");
      if (formSection) {
        formSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      this.notificar("Produto carregado para edição", "info");
    },
    async registrarEntradaLocal() {
      console.log("🔍 Iniciando registro de entrada...");

      if (!this.form.fornecedorId) {
        this.fornecedorErro = "Selecione um fornecedor";
        this.notificar("Selecione um fornecedor", "error");
        return;
      }

      if (this.form.itens.length === 0) {
        this.notificar("Inclua ao menos um produto", "error");
        return;
      }

      console.log("✅ Validações passaram. Unidade:", this.unidade);
      console.log("✅ Fornecedor ID:", this.form.fornecedorId);
      console.log("✅ Itens:", this.form.itens);

      this.loading = true;

      try {
        const payload = {
          nota_fiscal: this.form.notaFiscal || null,
          setor_id: this.unidade?.id || null,
          fornecedor_id: this.form.fornecedorId,
          itens: this.form.itens.map((item) => ({
            produto_id: item.produto_id,
            quantidade: item.quantidade,
            valor_unitario: item.valor_unitario ?? null,
            lote: item.lote,
            data_vencimento: item.data_vencimento,
            data_fabricacao: item.data_fabricacao,
          })),
        };

        console.log("📤 Enviando entrada para API:", payload);

        const response = await this.$axios.post("/entrada/add", payload, {
          headers: {
            Authorization: "Bearer " + this.$store.getters.getUserToken,
            "Content-Type": "application/json",
          },
        });

        console.log("📥 Resposta da API:", response.data);

        if (response.data?.status) {
          this.notificar("Entrada registrada com sucesso!", "success");
          this.$emit("registrado", response.data.data);
          this.fecharModal();
        } else {
          const mensagem =
            response.data?.message ||
            "Não foi possível registrar a entrada. Tente novamente.";
          this.notificar(mensagem, "error");
        }
      } catch (error) {
        console.error("❌ Erro ao registrar entrada:", error);
        console.error("Response:", error.response?.data);

        if (error.response?.data?.validacao && error.response?.data?.erros) {
          // Erros de validação
          const erros = error.response.data.erros;
          const primeiraChave = Object.keys(erros)[0];
          const mensagem = erros[primeiraChave]?.[0] || "Erro de validação";
          this.notificar(mensagem, "error");
          console.error("Erros de validação:", erros);
        } else {
          const mensagem =
            error.response?.data?.message ||
            "Erro ao registrar entrada. Verifique os dados e tente novamente.";
          this.notificar(mensagem, "error");
          console.error("Erro ao registrar entrada", error);
        }
      } finally {
        this.loading = false;
      }
    },
    fecharModal() {
      this.$emit("update:open", false);
      // Resetar o formulário após fechar
      this.$nextTick(() => {
        this.resetarFormulario();
      });
    },
    resetarFormulario() {
      this.loading = false;
      this.form = {
        notaFiscal: "",
        fornecedorId: "",
        itens: [],
      };
      this.fornecedorErro = "";
      this.produtoSelecionadoId = "";
      this.itemAtual = {
        quantidade: 1,
        lote: "",
        data_fabricacao: "",
        data_vencimento: "",
      };
      this.showFornecedorForm = false;
      this.showProdutoForm = false;
      this.novoProduto = {
        nome: "",
        unidade_medida_id: "",
        status: "A",
        grupo_produto_id: "",
        codigo_simpas: "",
        marca: "",
        codigo_barras: "",
      };
      this.cancelarGrupoProdutoForm();
      this.cancelarUnidadeMedidaForm();
    },
    notificar(mensagem, tipo = "info") {
      if (this.$toastr) {
        const mapper = {
          success: this.$toastr.success || this.$toastr.s,
          error: this.$toastr.error || this.$toastr.e,
          info: this.$toastr.info || this.$toastr.i,
        };
        const fn = mapper[tipo] || this.$toastr.info || this.$toastr.s;
        if (typeof fn === "function") {
          fn.call(this.$toastr, mensagem);
          return;
        }
      }
      const consoleMapper = {
        success: console.log,
        error: console.error,
        info: console.info,
      };
      const fallback = consoleMapper[tipo] || console.log;
      fallback(`[ModalEntradaEstoque] ${mensagem}`);
    },
    formatarData(data) {
      if (!data) return null;
      const [ano, mes, dia] = data.split("-");
      return `${dia}/${mes}/${ano}`;
    },
  },
};
</script>

<style scoped>
.btn-modal {
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.6rem 1.25rem;
  border-radius: 0.4rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border: none;
  min-width: 140px;
}

.table thead th {
  background-color: #f8f9fa;
}

.table tbody tr:last-child td {
  border-bottom: none;
}

/* Aumentar largura máxima do modal */
:deep(.modal-dialog) {
  max-width: 98vw !important;
  width: 98vw !important;
  margin: 1rem auto;
}

@media (min-width: 1400px) {
  :deep(.modal-dialog) {
    max-width: 1800px !important;
    width: 95vw !important;
  }
}

@media (min-width: 1920px) {
  :deep(.modal-dialog) {
    max-width: 2200px !important;
  }
}
</style>
