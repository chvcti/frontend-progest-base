<script setup>
import { computed, ref, watch, getCurrentInstance, onMounted } from "vue";
import { useStore } from "vuex";
import CadastroDialog from "@/components/layouts/CadastroDialog.vue";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const props = defineProps(["idModal", "functions"]);
const store = useStore();
const { proxy } = getCurrentInstance();

const localData = ref({
  id: null,
  nome: "",
  marca: "",
  status: "A",
  grupo_produto_id: "",
  lista_portaria: "",
  unidade_medida_id: "",
  codigo_simpas: "",
  codigo_barras: "",
});

/** Listas da Portaria SVS/MS 344/98 */
const LISTAS_PORTARIA = [
  { valor: "A1", descricao: "A1 — Entorpecentes" },
  { valor: "A2", descricao: "A2 — Entorpecentes de uso permitido em concentrações especiais" },
  { valor: "A3", descricao: "A3 — Psicotrópicos" },
  { valor: "B1", descricao: "B1 — Psicotrópicos" },
  { valor: "B2", descricao: "B2 — Psicotrópicos anorexígenos" },
  { valor: "C1", descricao: "C1 — Outras substâncias sujeitas a controle especial" },
  { valor: "C2", descricao: "C2 — Retinoicas de uso sistêmico" },
  { valor: "C3", descricao: "C3 — Imunossupressoras" },
  { valor: "C4", descricao: "C4 — Antirretrovirais" },
  { valor: "C5", descricao: "C5 — Anabolizantes" },
  { valor: "D1", descricao: "D1 — Precursoras de entorpecentes/psicotrópicos" },
  { valor: "D2", descricao: "D2 — Insumos para entorpecentes/psicotrópicos" },
  { valor: "E", descricao: "E — Plantas proscritas" },
  { valor: "F", descricao: "F — Substâncias de uso proscrito" },
];

const modalDataStore = computed(() => store.state.modalData.modalData);
const modalFunction = computed(() => store.state.modalData.modalFunction);
const modalErrors = computed(() => store.state.modalErrors || {});
const isModalOpen = computed({
  get: () => store.state.modalData.isModalOpen,
  set: (value) => store.commit("setModalOpen", value),
});

const gruposProdutos = computed(() => {
  const list = store.state.cadastros.gruposProdutos || [];
  return list.filter(g => g.status === 'A' || g.status === 'Ativo' || g.id == localData.value.grupo_produto_id);
});
const unidadesMedidaAux = computed(() => {
  const list = store.state.cadastros.unidadesMedidaAux || [];
  return list.filter(u => u.status === 'A' || u.status === 'Ativo' || u.id == localData.value.unidade_medida_id);
});

// Marcas exclusivas para sugestão no datalist
const listaMarcasUnicas = computed(() => {
  const prods = store.state.cadastros.listProdutos;
  if (!prods) return [];
  const items = Array.isArray(prods) ? prods : (prods.data || []);
  const marcas = items.map(p => p.marca).filter(m => m && m.trim() !== "");
  return [...new Set(marcas)].sort();
});

const showMarcas = ref(false);
const marcasFiltradas = computed(() => {
  const query = (localData.value.marca || "").toLowerCase();
  if (!query) return listaMarcasUnicas.value;
  return listaMarcasUnicas.value.filter(m => m.toLowerCase().includes(query));
});

const selecionarMarca = (m) => {
  localData.value.marca = m;
  showMarcas.value = false;
};

/** Grupo selecionado no formulário */
const grupoSelecionado = computed(() => {
  const list = store.state.cadastros.gruposProdutos || [];
  return (
    list.find((g) => g.id?.toString() === localData.value.grupo_produto_id?.toString()) ||
    null
  );
});

/** Produto é controlado quando pertence a um grupo controlado */
const grupoSelecionadoControlado = computed(
  () => !!grupoSelecionado.value?.controlado,
);

// Limpa a lista da portaria ao sair de um grupo controlado
watch(grupoSelecionadoControlado, (controlado) => {
  if (!controlado) localData.value.lista_portaria = "";
});

// Formulários inline
const showGrupoForm = ref(false);
const novoGrupo = ref({ nome: "", tipo: "Material", controlado: false });
const showUnidadeForm = ref(false);
const novaUnidade = ref({ nome: "", quantidade_unidade_minima: 1 });

const hasError = (campo) => !!modalErrors.value[campo];
const getError = (campo) =>
  modalErrors.value[campo]
    ? Array.isArray(modalErrors.value[campo])
      ? modalErrors.value[campo][0]
      : modalErrors.value[campo]
    : "";

watch(
  modalDataStore,
  (newValue) => {
    if (newValue) {
      localData.value = JSON.parse(JSON.stringify(newValue));
      if (!localData.value.status) localData.value.status = "A";
      if (localData.value.grupo_produto_id)
        localData.value.grupo_produto_id =
          localData.value.grupo_produto_id.toString();
      if (!localData.value.lista_portaria) localData.value.lista_portaria = "";
      if (localData.value.unidade_medida_id)
        localData.value.unidade_medida_id =
          localData.value.unidade_medida_id.toString();
    }
  },
  { deep: true, immediate: true },
);

onMounted(() => {
  carregarDadosAuxiliares();
});

const carregarDadosAuxiliares = () => {
  proxy.$axios
    .post("/grupoProduto/list", { filters: [{}], per_page: 500 })
    .then((r) => {
      if (r.data?.status) {
        const data = r.data.data.data || r.data.data;
        store.commit("cadastros/setGruposProdutos", Array.isArray(data) ? data : []);
      }
    });

  proxy.$axios
    .post("/unidadeMedida/list", { filters: [{}], per_page: 500 })
    .then((r) => {
      if (r.data?.status) {
        const data = r.data.data.data || r.data.data;
        store.commit("cadastros/setUnidadesMedidaAux", Array.isArray(data) ? data : []);
      }
    });
};

const salvarGrupoInline = () => {
  if (!novoGrupo.value.nome) {
    proxy.$toastr?.e("Preencha o nome do grupo!");
    return;
  }
  const payload = {
    grupoProduto: {
      nome: novoGrupo.value.nome,
      tipo: novoGrupo.value.tipo,
      controlado: novoGrupo.value.tipo === "Medicamento" && novoGrupo.value.controlado,
      status: "A" // Status sempre "A"
    }
  };
  proxy.$axios.post("/grupoProduto/add", payload).then((r) => {
    if (r.data?.status) {
      const gList = store.state.cadastros.gruposProdutos || [];
      store.commit("cadastros/setGruposProdutos", [...gList, r.data.data]);
      localData.value.grupo_produto_id = r.data.data.id.toString();
      showGrupoForm.value = false;
      novoGrupo.value = { nome: "", tipo: "Material", controlado: false };
      proxy.$toastr?.s("Grupo cadastrado com sucesso!");
    } else {
      proxy.$toastr?.e(r.data?.message || "Erro ao salvar Grupo");
    }
  });
};

const salvarUnidadeInline = () => {
  if (!novaUnidade.value.nome || !novaUnidade.value.quantidade_unidade_minima) {
    proxy.$toastr?.e("Preencha todos os campos da unidade!");
    return;
  }
  const payload = {
    unidadeMedida: {
      nome: novaUnidade.value.nome,
      quantidade_unidade_minima: parseFloat(novaUnidade.value.quantidade_unidade_minima),
      status: "A" // Status sempre "A"
    }
  };
  proxy.$axios.post("/unidadeMedida/add", payload).then((r) => {
    if (r.data?.status) {
      const uList = store.state.cadastros.unidadesMedidaAux || [];
      store.commit("cadastros/setUnidadesMedidaAux", [...uList, r.data.data]);
      localData.value.unidade_medida_id = r.data.data.id.toString();
      showUnidadeForm.value = false;
      novaUnidade.value = { nome: "", quantidade_unidade_minima: 1 };
      proxy.$toastr?.s("Unidade cadastrada com sucesso!");
    } else {
      proxy.$toastr?.e(r.data?.message || "Erro ao salvar Unidade");
    }
  });
};

// Limitar código de barras a 13 dígitos numéricos
const handleCodigoBarrasInput = (event) => {
  const raw = event.target.value.replace(/\D/g, "");
  if (raw.length > 13) {
    localData.value.codigo_barras = raw.substring(0, 13);
  } else {
    localData.value.codigo_barras = raw;
  }
};

// Limitar código SIMPAS a 20 caracteres alfanuméricos
const handleSimpasInput = (event) => {
  let raw = event.target.value.toUpperCase();
  if (raw.length > 20) {
    localData.value.codigo_simpas = raw.substring(0, 20);
  } else {
    localData.value.codigo_simpas = raw;
  }
};

const handleSave = () => {
  store.commit("setModalErrors", {});

  // Validação local
  if (
    !localData.value.nome ||
    localData.value.nome.trim().length < 3
  ) {
    store.commit("setModalErrors", {
      nome: ["O nome do produto é obrigatório (mín. 3 caracteres)."],
    });
    return;
  }

  if (!localData.value.grupo_produto_id) {
    store.commit("setModalErrors", {
      grupo_produto_id: ["O grupo do produto é obrigatório."],
    });
    return;
  }

  if (!localData.value.unidade_medida_id) {
    store.commit("setModalErrors", {
      unidade_medida_id: ["A unidade de medida é obrigatória."],
    });
    return;
  }

  // Medicamento controlado exige a lista da Portaria 344/98
  if (grupoSelecionadoControlado.value && !localData.value.lista_portaria) {
    store.commit("setModalErrors", {
      lista_portaria: [
        "Informe a lista da Portaria 344/98 para medicamentos controlados.",
      ],
    });
    return;
  }

  const content = {
    $axios: proxy.$axios,
    $store: store,
    $toastr: proxy.$toastr,
    modalData: localData.value,
    onSuccess: () => {
      store.commit("setModalOpen", false);
    },
  };

  props.functions.ADD_UP(content, modalFunction.value);
};
</script>

<template>
  <CadastroDialog
    v-model:open="isModalOpen"
    :title="modalFunction === 'ADD' ? 'Cadastrar Produto' : 'Editar Produto'"
  >
    <div class="space-y-4 py-2">
      <!-- Nome (full width) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-2 md:col-span-2">
          <Label for="prod-nome">
            Nome <span class="text-destructive">*</span>
          </Label>
          <Input
            id="prod-nome"
            v-model="localData.nome"
            placeholder="Nome do produto"
            :class="{
              'border-red-500 focus-visible:ring-red-500': hasError('nome'),
            }"
          />
          <p v-if="hasError('nome')" class="text-xs text-destructive mt-1">
            {{ getError("nome") }}
          </p>
        </div>

        <!-- Marca e Status -->
        <div class="space-y-2">
          <Label for="prod-marca">Marca</Label>
          <div class="relative">
            <Input
              id="prod-marca"
              v-model="localData.marca"
              autocomplete="off"
              @focus="showMarcas = true"
              @blur="setTimeout(() => showMarcas = false, 200)"
              placeholder="Ex: Samsung, Nestlé"
              :class="{
                'border-red-500 focus-visible:ring-red-500': hasError('marca'),
              }"
            />
            <div
              v-if="showMarcas && marcasFiltradas.length > 0"
              class="absolute z-[2500] w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto"
            >
              <div
                v-for="m in marcasFiltradas"
                :key="m"
                @mousedown.prevent="selecionarMarca(m)"
                class="px-3 py-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-100 hover:text-indigo-600 transition-colors"
              >
                {{ m }}
              </div>
            </div>
          </div>
          <p v-if="hasError('marca')" class="text-xs text-destructive mt-1">
            {{ getError("marca") }}
          </p>
        </div>

        <div class="space-y-2">
          <Label for="prod-status">Status</Label>
          <Select v-model="localData.status">
            <SelectTrigger
              :class="{ 'border-red-500': hasError('status') }"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="A">Ativo</SelectItem>
              <SelectItem value="I">Inativo</SelectItem>
            </SelectContent>
          </Select>
          <p v-if="hasError('status')" class="text-xs text-destructive mt-1">
            {{ getError("status") }}
          </p>
        </div>
      </div>

      <!-- Grupo e Unidade -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label>
            Grupo do Produto <span class="text-destructive">*</span>
          </Label>
          <div class="flex gap-2">
            <Select v-model="localData.grupo_produto_id">
              <SelectTrigger
                class="w-full"
                :class="{ 'border-red-500': hasError('grupo_produto_id') }"
              >
                <SelectValue placeholder="Selecione um grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="g in gruposProdutos"
                  :key="g.id"
                  :value="g.id.toString()"
                >
                  {{ g.nome }}
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              class="shrink-0 text-slate-500 hover:text-primary"
              title="Cadastrar Novo Grupo"
              @click="showGrupoForm = !showGrupoForm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            </Button>
          </div>
          <p
            v-if="hasError('grupo_produto_id')"
            class="text-xs text-destructive mt-1"
          >
            {{ getError("grupo_produto_id") }}
          </p>
          
          <!-- Lista da Portaria 344/98 — somente para grupos controlados -->
          <div
            v-if="grupoSelecionadoControlado"
            class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2"
          >
            <Label class="text-amber-800">
              Lista da Portaria 344/98 <span class="text-destructive">*</span>
            </Label>
            <Select v-model="localData.lista_portaria">
              <SelectTrigger
                class="w-full bg-white"
                :class="{ 'border-red-500': hasError('lista_portaria') }"
              >
                <SelectValue placeholder="Selecione a lista" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="l in LISTAS_PORTARIA"
                  :key="l.valor"
                  :value="l.valor"
                >
                  {{ l.descricao }}
                </SelectItem>
              </SelectContent>
            </Select>
            <p class="text-[11px] text-amber-700">
              Medicamento controlado: a lista é obrigatória e aparece no relatório
              de medicamentos controlados.
            </p>
            <p
              v-if="hasError('lista_portaria')"
              class="text-xs text-destructive"
            >
              {{ getError("lista_portaria") }}
            </p>
          </div>

          <!-- Formulário Inline Grupo Produto -->
          <div v-if="showGrupoForm" class="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3 relative animate-in fade-in slide-in-from-top-2">
            <button class="absolute top-2 right-2 text-slate-400 hover:text-red-500" @click="showGrupoForm = false">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <h4 class="text-[10px] font-black uppercase text-slate-500 tracking-wider">Novo Grupo Rápido</h4>
            <div class="grid gap-2">
              <Input v-model="novoGrupo.nome" placeholder="Nome do Grupo" class="h-8 text-xs" />
              <Select v-model="novoGrupo.tipo">
                <SelectTrigger class="h-8 text-xs bg-white">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Medicamento">Medicamento</SelectItem>
                  <SelectItem value="Material">Material</SelectItem>
                </SelectContent>
              </Select>
              <label
                v-if="novoGrupo.tipo === 'Medicamento'"
                class="flex items-center gap-2 text-[11px] font-semibold text-amber-700 cursor-pointer"
              >
                <input
                  type="checkbox"
                  v-model="novoGrupo.controlado"
                  class="h-3.5 w-3.5 rounded border-slate-300 accent-amber-600"
                />
                Grupo de medicamentos controlados
              </label>
            </div>
            <Button @click="salvarGrupoInline" class="w-full h-8 text-xs" variant="secondary">Adicionar</Button>
          </div>
        </div>

        <div class="space-y-2">
          <Label>
            Unidade de Medida <span class="text-destructive">*</span>
          </Label>
          <div class="flex gap-2">
            <Select v-model="localData.unidade_medida_id">
              <SelectTrigger
                class="w-full"
                :class="{ 'border-red-500': hasError('unidade_medida_id') }"
              >
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="u in unidadesMedidaAux"
                  :key="u.id"
                  :value="u.id.toString()"
                >
                  {{ u.nome }}
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              class="shrink-0 text-slate-500 hover:text-primary"
              title="Cadastrar Nova Unidade"
              @click="showUnidadeForm = !showUnidadeForm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            </Button>
          </div>
          <p
            v-if="hasError('unidade_medida_id')"
            class="text-xs text-destructive mt-1"
          >
            {{ getError("unidade_medida_id") }}
          </p>

          <!-- Formulário Inline Unidade Medida -->
          <div v-if="showUnidadeForm" class="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3 relative animate-in fade-in slide-in-from-top-2">
            <button class="absolute top-2 right-2 text-slate-400 hover:text-red-500" @click="showUnidadeForm = false">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            <h4 class="text-[10px] font-black uppercase text-slate-500 tracking-wider">Nova Unidade Rápida</h4>
            <div class="grid grid-cols-3 gap-2">
              <Input v-model="novaUnidade.nome" placeholder="Nome/Sigla" class="col-span-2 h-8 text-xs" />
              <Input v-model="novaUnidade.quantidade_unidade_minima" type="number" step="0.01" class="col-span-1 h-8 text-xs px-2" placeholder="Qtd" />
            </div>
            <p class="text-[9px] text-slate-400 leading-tight">A Quantidade define o multiplicador base para cálculo matemático de fracionamento de itens.</p>
            <Button @click="salvarUnidadeInline" class="w-full h-8 text-xs" variant="secondary">Adicionar</Button>
          </div>
        </div>
      </div>

      <!-- Códigos -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="simpas">
            Código SIMPAS
            <span class="text-muted small fw-normal">(opcional)</span>
          </Label>
          <div class="relative">
            <Input
              id="simpas"
              v-model="localData.codigo_simpas"
              @input="handleSimpasInput"
              placeholder="Ex: ABC-123.45"
              :class="[
                {
                  'border-red-500 focus-visible:ring-red-500':
                    hasError('codigo_simpas'),
                },
                'uppercase-input',
              ]"
            />
            <span
              v-if="hasError('codigo_simpas')"
              class="text-xs text-red-500 absolute -bottom-5 left-0"
            >
              {{ getError("codigo_simpas") }}
            </span>
          </div>
        </div>
        <div class="space-y-2">
          <Label for="barras">
            Código de Barras
            <span class="text-[10px] text-slate-400 ml-1">(máx. 13 dígitos)</span>
          </Label>
          <Input
            id="barras"
            v-model="localData.codigo_barras"
            maxlength="13"
            placeholder="Ex: 7891234567890"
            :class="{
              'border-red-500 focus-visible:ring-red-500':
                hasError('codigo_barras'),
            }"
            @input="handleCodigoBarrasInput"
          />
          <p
            v-if="hasError('codigo_barras')"
            class="text-xs text-destructive mt-1"
          >
            {{ getError("codigo_barras") }}
          </p>
        </div>
      </div>
    </div>

    <template #footer="{ close }">
      <Button variant="outline" @click="close">Fechar</Button>
      <Button @click="handleSave" class="min-w-[100px]">
        {{ modalFunction === "ADD" ? "Salvar" : "Atualizar" }}
      </Button>
    </template>
  </CadastroDialog>
</template>
