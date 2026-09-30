<script setup>
import { computed, inject, ref } from "vue";
import { useStore } from "vuex";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  PlusIcon,
  DownloadIcon,
  FileTextIcon,
  CalendarIcon,
  UserIcon,
  ArrowDownIcon,
  SearchIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
} from "lucide-vue-next";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ModalEntradaEstoque from "@/components/cadastros/ModalEntradaEstoque.vue";
import ModalVisualizarEntrada from "@/components/cadastros/ModalVisualizarEntrada.vue";

const emit = defineEmits(["reload-estoque"]);

const props = defineProps({
  setorId: { type: Number, required: true },
});

const store = useStore();
const user = computed(() => store.state.auth.user || {});
const isAdmin = computed(() => {
  const u = user.value;
  if (!u) return false;
  if (
    u.is_super_admin ||
    u.is_admin ||
    store.getters["auth/isSuperAdmin"]
  ) {
    return true;
  }
  if (u.perfil === "admin" || u.role === "admin" || u.usuario_tipo === "admin") {
    return true;
  }

  const list = store.state.estoque.listUsuariosSetor || [];
  const found = list.find((item) => {
    const userId = item.usuario_id || item.user_id || item.id || item.usuario?.id;
    const perfil = (item.perfil || item.pivot?.perfil || "").toString().toLowerCase();
    return userId === u.id && perfil === "admin";
  });
  if (found) return true;

  const setoresComAcesso = store.getters["estoque/getSetoresComAcesso"] || [];
  return setoresComAcesso.some((s) => s.perfil === "admin");
});

const isAlmoxarife = computed(() => {
  const u = user.value;
  if (!u) return false;
  if (u.perfil === "almoxarife" || u.role === "almoxarife") return true;

  const list = store.state.estoque.listUsuariosSetor || [];
  const found = list.find((item) => {
    const userId = item.usuario_id || item.user_id || item.id || item.usuario?.id;
    const perfil = (item.perfil || item.pivot?.perfil || "").toString().toLowerCase();
    return userId === u.id && (perfil === "almoxarife" || perfil.includes("almoxarife"));
  });
  if (found) return true;

  const setoresComAcesso = store.getters["estoque/getSetoresComAcesso"] || [];
  return setoresComAcesso.some((s) => s.perfil === "almoxarife");
});

const canAddEntrada = computed(() => isAdmin.value || isAlmoxarife.value);
const parentData = inject("setorAtualData", {
  entradasItems: [],
});

const setorAtual = computed(() => store.state.estoque.setorDetails || {});
const entradaSelecionada = ref(null);
const dialogEntradaOpen = ref(false);
const modalVisualizarEntrada = ref(null);

const filterFornecedor = ref("todos");
const searchQuery = ref("");
const sortBy = ref("created_at");
const sortDir = ref("desc");

const listFornecedores = computed(() => {
  const entradas = parentData.entradasItems?.value || parentData.entradasItems || [];
  const fornecedores = new Set();
  entradas.forEach(e => {
    if (e.fornecedor?.razao_social_nome) {
      fornecedores.add(e.fornecedor.razao_social_nome);
    } else {
      fornecedores.add("Fornecedor Externo");
    }
  });
  return Array.from(fornecedores).sort();
});

const handleSort = (col) => {
  if (sortBy.value === col) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  } else {
    sortBy.value = col;
    sortDir.value = "asc";
  }
};

const listEntradas = computed(() => {
  let items = [...(parentData.entradasItems?.value || parentData.entradasItems || [])];
  
  if (filterFornecedor.value !== "todos") {
    items = items.filter(e => {
      const forn = e.fornecedor?.razao_social_nome || "Fornecedor Externo";
      return forn === filterFornecedor.value;
    });
  }

  if (searchQuery.value) {
    const term = searchQuery.value.toLowerCase();
    items = items.filter((e) => {
      const protocolo = e.id?.toString() || "";
      const nf = e.nota_fiscal?.toLowerCase() || "";
      const forn = e.fornecedor?.razao_social_nome?.toLowerCase() || "fornecedor externo";
      return protocolo.includes(term) || nf.includes(term) || forn.includes(term);
    });
  }

  return items.sort((a, b) => {
    let valA = null;
    let valB = null;

    if (sortBy.value === 'created_at') {
      valA = new Date(a.created_at).getTime();
      valB = new Date(b.created_at).getTime();
    } else if (sortBy.value === 'protocolo') {
      valA = Number(a.id);
      valB = Number(b.id);
    } else if (sortBy.value === 'fornecedor') {
      valA = (a.fornecedor?.razao_social_nome || "Fornecedor Externo").toLowerCase();
      valB = (b.fornecedor?.razao_social_nome || "Fornecedor Externo").toLowerCase();
    } else if (sortBy.value === 'nota_fiscal') {
      valA = (a.nota_fiscal || "").toLowerCase();
      valB = (b.nota_fiscal || "").toLowerCase();
    }

    if (valA < valB) return sortDir.value === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir.value === 'asc' ? 1 : -1;
    return 0;
  });
});

const formatarData = (data) => {
  if (!data) return "--/--/----";
  return new Date(data).toLocaleDateString("pt-BR");
};

const formatarHora = (data) => {
  if (!data) return "";
  return new Date(data).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const visualizarEntrada = (entrada) => {
  entradaSelecionada.value = entrada;
  if (modalVisualizarEntrada.value) {
    modalVisualizarEntrada.value.dialogOpen = true;
  }
};

const handleEntradaRegistrada = async () => {
  const functionsEntrada = (await import("@/functions/cad_entradas")).default;
  const context = {
    $axios: axios,
    $store: store,
    entradasItems: parentData.entradasItems,
  };
  if (functionsEntrada.listByUnidade) {
    await functionsEntrada.listByUnidade(context, props.setorId);
  }
  emit("reload-estoque");
};
</script>

<template>
  <div class="flex flex-col gap-4 pb-10">
    <!-- Header / Toolbar -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <!-- Filtros e Ordenação -->
      <div class="flex flex-1 items-center gap-3">
        <Select v-model="filterFornecedor">
          <SelectTrigger class="h-10 w-[200px] text-sm bg-white border-slate-200 rounded-xl shadow-sm">
            <SelectValue placeholder="Fornecedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Fornecedores</SelectItem>
            <SelectItem v-for="forn in listFornecedores" :key="forn" :value="forn">
              {{ forn }}
            </SelectItem>
          </SelectContent>
        </Select>

        <div class="relative w-full max-w-sm">
          <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            v-model="searchQuery"
            placeholder="Buscar por protocolo, NF ou fornecedor..."
            class="h-10 !pl-10 pr-4 text-sm bg-white border-slate-200 rounded-xl focus-visible:ring-primary/20 transition-all shadow-sm w-full"
          />
        </div>
      </div>

      <Button
        v-if="canAddEntrada"
        @click="dialogEntradaOpen = true"
        class="gap-2 shadow-lg shadow-primary/20 shrink-0"
      >
        <PlusIcon class="w-4 h-4" /> Registrar Nova Entrada
      </Button>
    </div>

    <!-- Table -->
    <Card
      v-if="listEntradas.length > 0"
      class="border-slate-200 shadow-sm overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 border-b">
            <tr>
              <th
                @click="handleSort('protocolo')"
                class="py-4 px-6 text-left font-bold text-slate-500 uppercase text-[10px] cursor-pointer hover:bg-slate-100 transition-colors select-none"
              >
                <div class="flex items-center gap-1">
                  Protocolo
                  <ArrowUpDownIcon v-if="sortBy !== 'protocolo'" class="w-3 h-3 opacity-50" />
                  <ArrowUpIcon v-else-if="sortDir === 'asc'" class="w-3 h-3 text-primary" />
                  <ArrowDownIcon v-else class="w-3 h-3 text-primary" />
                </div>
              </th>
              <th
                @click="handleSort('created_at')"
                class="py-4 px-6 text-left font-bold text-slate-500 uppercase text-[10px] cursor-pointer hover:bg-slate-100 transition-colors select-none"
              >
                <div class="flex items-center gap-1">
                  Data e Hora
                  <ArrowUpDownIcon v-if="sortBy !== 'created_at'" class="w-3 h-3 opacity-50" />
                  <ArrowUpIcon v-else-if="sortDir === 'asc'" class="w-3 h-3 text-primary" />
                  <ArrowDownIcon v-else class="w-3 h-3 text-primary" />
                </div>
              </th>
              <th
                @click="handleSort('nota_fiscal')"
                class="py-4 px-6 text-left font-bold text-slate-500 uppercase text-[10px] cursor-pointer hover:bg-slate-100 transition-colors select-none"
              >
                <div class="flex items-center gap-1">
                  Nota Fiscal
                  <ArrowUpDownIcon v-if="sortBy !== 'nota_fiscal'" class="w-3 h-3 opacity-50" />
                  <ArrowUpIcon v-else-if="sortDir === 'asc'" class="w-3 h-3 text-primary" />
                  <ArrowDownIcon v-else class="w-3 h-3 text-primary" />
                </div>
              </th>
              <th
                @click="handleSort('fornecedor')"
                class="py-4 px-6 text-left font-bold text-slate-500 uppercase text-[10px] cursor-pointer hover:bg-slate-100 transition-colors select-none"
              >
                <div class="flex items-center gap-1">
                  Fornecedor
                  <ArrowUpDownIcon v-if="sortBy !== 'fornecedor'" class="w-3 h-3 opacity-50" />
                  <ArrowUpIcon v-else-if="sortDir === 'asc'" class="w-3 h-3 text-primary" />
                  <ArrowDownIcon v-else class="w-3 h-3 text-primary" />
                </div>
              </th>
              <th
                class="py-4 px-6 text-center font-bold text-slate-500 uppercase text-[10px]"
              >
                Itens
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="entrada in listEntradas"
              :key="entrada.id"
              @click="visualizarEntrada(entrada)"
              class="hover:bg-slate-50/50 transition-colors cursor-pointer group"
            >
              <td class="py-4 px-6">
                <Badge
                  variant="outline"
                  class="font-black text-slate-400 border-slate-200"
                  >#{{ entrada.id }}</Badge
                >
              </td>
              <td class="py-4 px-6">
                <div class="flex flex-col">
                  <span class="font-bold text-slate-700">{{
                    formatarData(entrada.created_at)
                  }}</span>
                  <span class="text-[11px] text-slate-400 font-medium">{{
                    formatarHora(entrada.created_at)
                  }}</span>
                </div>
              </td>
              <td class="py-4 px-6 font-medium text-slate-600">
                <div class="flex items-center gap-2">
                  <FileTextIcon class="w-3.5 h-3.5 text-slate-300" />
                  {{ entrada.nota_fiscal || "N/A" }}
                </div>
              </td>
              <td class="py-4 px-6">
                <div class="flex items-center gap-2">
                  <div
                    class="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors"
                  >
                    <UserIcon class="w-3.5 h-3.5" />
                  </div>
                  <span class="font-medium text-slate-700">{{
                    entrada.fornecedor?.razao_social_nome ||
                    "Fornecedor Externo"
                  }}</span>
                </div>
              </td>
              <td class="py-4 px-6 text-center">
                <div
                  class="inline-flex h-6 px-2 items-center justify-center rounded-full bg-primary/10 text-primary font-black text-[10px]"
                >
                  {{ entrada.itens?.length || 0 }} SKU
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>

    <!-- Empty State -->
    <div
      v-else
      class="flex flex-col items-center justify-center py-20 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl"
    >
      <div class="p-6 bg-white rounded-full shadow-sm mb-4">
        <ArrowDownIcon class="w-12 h-12 text-slate-300" />
      </div>
      <h3 class="text-slate-800 font-bold text-lg">Sem Entradas Externas</h3>
      <p class="text-slate-500 text-sm max-w-xs text-center mt-2 mb-4">
        Nenhuma nota fiscal foi lançada diretamente para este setor até o
        momento.
      </p>
      <Button
        v-if="isAdmin"
        @click="dialogEntradaOpen = true"
        class="gap-2 shadow-lg shadow-primary/20"
      >
        <PlusIcon class="w-4 h-4" /> Registrar Nova Entrada
      </Button>
    </div>

    <!-- Modals -->
    <ModalEntradaEstoque
      v-model:open="dialogEntradaOpen"
      :unidade="{ id: setorId }"
      :setorTipo="setorAtual.tipo"
      @registrado="handleEntradaRegistrada"
    />

    <ModalVisualizarEntrada
      ref="modalVisualizarEntrada"
      :entrada="entradaSelecionada"
    />
  </div>
</template>
