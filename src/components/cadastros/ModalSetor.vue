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
import { Trash2Icon, PlusIcon } from "lucide-vue-next";
import apiSetores from "@/functions/cad_setores.js";
import apiPolos from "@/functions/cad_unidades_polos.js";
import { formatarNomeSetor } from "@/utils/formatters.js";

const props = defineProps(["idModal", "functions"]);
const store = useStore();
const { proxy } = getCurrentInstance();

const loading = ref(false);
const localData = ref({
  id: null,
  status: "A",
  nome: "",
  descricao: "",
  estoque: false,
  tipo: "Material",
  polo_id: "",
});
const distribuidores = ref([]);
const selectedSetorId = ref("");

const modalDataStore = computed(() => store.state.modalData.modalData);
const modalFunction = computed(() => store.state.modalData.modalFunction);
const isModalOpen = computed({
  get: () => store.state.modalData.isModalOpen,
  set: (value) => store.commit("setModalOpen", value),
});

const polosList = computed(() => {
  const list = store.state.cadastros.listPolos;
  if (Array.isArray(list)) return list;
  return Array.isArray(list?.data) ? list.data : [];
});

const allSetores = computed(() => {
  const list = store.state.cadastros.listSetoresGerais || {};
  const arr = Array.isArray(list.data) ? list.data : [];
  return arr.filter(
    (s) => s.estoque === true || s.estoque === 1 || s.estoque === "1",
  );
});

const setoresDisponiveis = computed(() => {
  const usados = distribuidores.value
    .map((d) => d.setor_distribuidor_id)
    .filter(Boolean);
  return allSetores.value.filter((s) => !usados.includes(s.id));
});

watch(
  modalDataStore,
  (newValue) => {
    if (newValue) {
      localData.value = JSON.parse(JSON.stringify(newValue));
      if (!localData.value.status) localData.value.status = "A";
      if (localData.value.polo_id)
        localData.value.polo_id = localData.value.polo_id.toString();

      // Popular distribuidores a partir dos dados do backend
      const rel =
        newValue.distribuidores_relacionados || newValue.fornecedores || [];
        
      distribuidores.value = rel.map((r) => {
        // O backend retorna a chave 'distribuidor', não 'fornecedor'
        const dObj = r.distribuidor || r.fornecedor || r.fornecedor_relacionado || {};
        return {
          id: r.id,
          setor_distribuidor_id: r.setor_distribuidor_id || dObj.id || null,
          nome:
            dObj.nome ||
            dObj.razao_social_nome ||
            dObj.razao_social ||
            "Setor Distribuidor",
        };
      });
    }
  },
  { deep: true, immediate: true },
);

onMounted(() => {
  ensureAuxData();
});

const ensureAuxData = () => {
  if (polosList.value.length === 0)
    apiPolos.listAll({ $axios: proxy.$axios, $store: store });
  if (allSetores.value.length === 0)
    apiSetores.listAll({ $axios: proxy.$axios, $store: store });
};

const handleSave = () => {
  store.commit("setModalErrors", {});
  loading.value = true;

  const modalCopy = JSON.parse(JSON.stringify(localData.value));
  
  // Trata e limpa os distribuidores antes de salvar
  // Enviar como 'distribuidores' com 'setor_distribuidor_id' para casar com o backend
  modalCopy.distribuidores = distribuidores.value
    .filter((d) => d.setor_distribuidor_id)
    .map((d) => ({
      id: d.id || undefined,
      setor_distribuidor_id: d.setor_distribuidor_id,
    }));

  const content = {
    $axios: proxy.$axios,
    $store: store,
    modalData: modalCopy,
    $toastr: proxy.$toastr,
  };

  props.functions.ADD_UP(content, modalFunction.value);
  
  // Em um cenário real de API, o ideal seria o loading = false ocorrer no retorno da promise da function, 
  // mas mantive a estrutura original.
  setTimeout(() => { loading.value = false; }, 500);
};

const adicionarDistribuidor = () => {
  const setor = allSetores.value.find((s) => s.id == selectedSetorId.value);
  if (setor) {
    distribuidores.value.push({
      setor_distribuidor_id: setor.id,
      nome: setor.nome,
    });
    selectedSetorId.value = "";
  }
};

const removeDistribuidor = (index) => {
  distribuidores.value.splice(index, 1);
};
</script>

<template>
  <CadastroDialog
    v-model:open="isModalOpen"
    :title="modalFunction === 'ADD' ? 'Cadastrar Setor' : 'Editar Setor'"
  >
    <div class="space-y-4 py-2">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label>Status</Label>
          <Select v-model="localData.status">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="A">Ativo</SelectItem>
              <SelectItem value="I">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label>Tipo</Label>
          <Select v-model="localData.tipo">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Material">Material</SelectItem>
              <SelectItem value="Medicamento">Medicamento</SelectItem>
              <SelectItem value="Ambos">Ambos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label>Controla Estoque?</Label>
          <Select v-model="localData.estoque">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem :value="true">Sim, com controle</SelectItem>
              <SelectItem :value="false">Não, sem controle</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2">
          <Label>Polo</Label>
          <Select v-model="localData.polo_id">
            <SelectTrigger
              ><SelectValue placeholder="Selecione o polo"
            /></SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="u in polosList"
                :key="u.id"
                :value="u.id.toString()"
              >
              {{ u.sigla ? `${u.sigla} — ${u.nome}` : u.nome }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div class="space-y-2">
        <Label for="setor-nome"
          >Nome do Setor <span class="text-destructive">*</span></Label
        >
        <Input
          id="setor-nome"
          v-model="localData.nome"
          placeholder="Ex: Farmácia Central, Almoxarifado"
        />
      </div>

      <div class="space-y-2">
        <Label for="setor-desc">Descrição / Observações</Label>
        <textarea
          id="setor-desc"
          v-model="localData.descricao"
          class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Detalhes sobre o setor..."
        ></textarea>
      </div>

      <div class="space-y-3 border rounded-lg p-4 bg-slate-50/50">
        <Label class="text-sm font-bold flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-primary"></span>
          Setores Fornecedores (Distribuidores)
        </Label>

        <div class="flex gap-2 w-full">
          <Select :model-value="selectedSetorId" @update:model-value="val => { selectedSetorId = val; adicionarDistribuidor(); }">
            <SelectTrigger
              ><SelectValue placeholder="Selecione um fornecedor"
            /></SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="s in setoresDisponiveis"
                :key="s.id"
                :value="s.id.toString()"
              >
                {{ formatarNomeSetor(s) }} ({{ s.tipo }})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-2 max-h-[150px] overflow-y-auto pr-1">
          <div
            v-for="(d, idx) in distribuidores"
            :key="idx"
            class="flex items-center justify-between p-2 bg-white border rounded-md shadow-sm animate-in fade-in slide-in-from-left-2"
          >
            <span class="text-sm font-medium">{{ d.nome }}</span>
            <Button
              variant="ghost"
              size="icon"
              @click="removeDistribuidor(idx)"
              class="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2Icon class="h-4 w-4" />
            </Button>
          </div>
          <p
            v-if="distribuidores.length === 0"
            class="text-xs text-muted-foreground italic text-center py-2"
          >
            Nenhum distribuidor vinculado.
          </p>
        </div>
      </div>
    </div>

    <template #footer="{ close }">
      <Button variant="outline" @click="close">Fechar</Button>
      <Button @click="handleSave" :disabled="loading">
        {{ modalFunction === "ADD" ? "Salvar" : "Atualizar" }}
      </Button>
    </template>
  </CadastroDialog>
</template>