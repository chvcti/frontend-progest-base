<script setup>
import { computed, ref, onMounted, getCurrentInstance } from "vue";
import { useStore } from "vuex";
import LinkModal01 from "@/components/layouts/LinkModal01.vue";
import TemplateAdmin from "@/views/roleAdmin/TemplateAdmin.vue";
import ModalProdutos from "@/components/cadastros/ModalProdutos.vue";
import ModalProdutosView from "@/components/cadastros/ModalProdutosView.vue";
import DataTable from "@/components/ui/data-table/DataTable.vue";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  PackageIcon,
  LayersIcon,
  BoxSelectIcon,
  FilterIcon,
  BarcodeIcon,
} from "lucide-vue-next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import functions from "@/functions/cad_produtos.js";

const store = useStore();
const { proxy } = getCurrentInstance();

const titleModal = "Cadastro de Produtos";
const varsModalData = {
  status: "A",
  nome: "",
  marca: "",
  codigo_simpas: "",
  codigo_barras: "",
  grupo_produto_id: "",
  unidade_medida_id: "",
};

const formatarSimpas = (codigo) => {
  if (!codigo) return "—";
  const str = String(codigo).trim();
  // Formato SIMPAS Oficial Bahia: XX.XX.XX.XXXXXXXX-X (15 dígitos)
  if (/^\d{15}$/.test(str)) {
    return `${str.slice(0, 2)}.${str.slice(2, 4)}.${str.slice(4, 6)}.${str.slice(6, 14)}-${str.slice(14)}`;
  }
  return str;
};

const columns = [
  { key: "id", label: "#", align: "center", sortable: true },
  { key: "codigo_simpas", label: "Cód. SIMPAS", align: "center", sortable: true },
  { key: "codigo_barras", label: "Cód. Barras", align: "center", sortable: true },
  { key: "nome", label: "Produto", sortable: true },
  { key: "marca", label: "Marca", sortable: true },
  { key: "grupo_produto", label: "Grupo", sortable: true },
  { key: "unidade_medida", label: "Unidade", align: "center", sortable: true },
  { key: "status", label: "Status", align: "center", sortable: true },
];

// Estado local
const searchQuery = ref("");
const sortBy = ref("nome");
const sortDir = ref("asc");
const filterGrupo = ref("");
const filterMarca = ref("");

// Listas auxiliares para os filtros
const gruposParaFiltro = computed(() => store.state.cadastros.gruposProdutos || []);

// Lista unica de marcas extraídas dos produtos
const marcasParaFiltro = computed(() => {
  const data = listProdutos.value;
  const marcas = [...new Set(data.filter((p) => p.marca).map((p) => p.marca))];
  return marcas.sort();
});

const isAdmin = computed(() => {
  const user = store.state.auth.user || store.getters["auth/getUser"];
  if (!user) return false;
  if (
    user.is_super_admin ||
    user.is_admin ||
    store.getters["auth/isSuperAdmin"]
  ) {
    return true;
  }
  if (user.perfil === "admin" || user.role === "admin" || user.usuario_tipo === "admin") {
    return true;
  }
  const list = store.state.estoque.listUsuariosSetor || [];
  if (
    list.some(
      (u) =>
        (u.usuario_id === user.id || u.id === user.id) &&
        (u.perfil === "admin" || u.pivot?.perfil === "admin")
    )
  ) {
    return true;
  }
  const setoresComAcesso = store.getters["estoque/getSetoresComAcesso"] || [];
  return setoresComAcesso.some((s) => s.perfil === "admin");
});

const canManageProdutos = computed(() => isAdmin.value);

const listProdutos = computed(() => {
  const data = store.state.cadastros.listProdutos;
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return data.data && Array.isArray(data.data) ? data.data : [];
});

const formattedProdutos = computed(() => {
  return listProdutos.value.map((produto) => ({
    id: produto.id,
    codigo_simpas: produto.codigo_simpas || "",
    codigo_barras: produto.codigo_barras || "",
    nome: produto.nome,
    marca: produto.marca || "N/A",
    grupo_produto: produto.grupo_produto?.nome || "—",
    controlado: !!(produto.grupo_produto?.controlado ?? produto.controlado),
    lista_portaria: produto.lista_portaria || "",
    unidade_medida:
      produto.unidade_medida?.sigla || produto.unidade_medida?.nome || "UN",
    status: produto.status === "A" ? "Ativo" : produto.status === "I" ? "Inativo" : produto.status,
    // dados brutos p/ view
    _raw: produto,
  }));
});

const listAllProdutos = (url = null) => {
  functions.listAll(
    {
      $axios: proxy.$axios,
      $store: store,
      $toastr: proxy.$toastr,
      search: searchQuery.value,
      sort_by: sortBy.value,
      sort_dir: sortDir.value,
      grupo_produto_id: filterGrupo.value,
      marca_filter: filterMarca.value,
    },
    url,
  );
};

const handleSearch = (query) => {
  searchQuery.value = query;
  listAllProdutos();
};

const handleSort = (key) => {
  if (sortBy.value === key) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  } else {
    sortBy.value = key;
    sortDir.value = "asc";
  }
  listAllProdutos();
};

const handleFilterGrupo = (value) => {
  filterGrupo.value = value === "all" ? "" : value;
  listAllProdutos();
};

const handleFilterMarca = (value) => {
  filterMarca.value = value === "all" ? "" : value;
  listAllProdutos();
};

// Visualização
const isViewModalOpen = ref(false);
const viewingItem = ref({});

const handleView = (item) => {
  functions.listData({
    idData: item.id,
    $axios: proxy.$axios,
    $store: store,
    $toastr: proxy.$toastr,
    callback: () => {
      viewingItem.value = store.state.modalData.modalData || {};
      isViewModalOpen.value = true;
    },
  });
};

const handleEdit = (item) => {
  functions.listData({
    idData: item.id,
    $axios: proxy.$axios,
    $store: store,
    $toastr: proxy.$toastr,
    callback: () => {
      store.commit("setModalFunction", "UP");
      store.commit("setModalOpen", true);
    },
  });
};

const isToggleDialogOpen = ref(false);
const itemToToggle = ref(null);

const handleToggleStatus = (item) => {
  itemToToggle.value = item;
  isToggleDialogOpen.value = true;
};

const confirmToggleStatus = () => {
  if (itemToToggle.value) {
    functions.deleteData(
      { $axios: proxy.$axios, $store: store, $toastr: proxy.$toastr },
      itemToToggle.value.id
    );
    isToggleDialogOpen.value = false;
  }
};

onMounted(() => {
  listAllProdutos();

  // Carregar grupos para o filtro
  if (gruposParaFiltro.value.length === 0) {
    proxy.$axios
      .post("/grupoProduto/list", { filters: [{}], per_page: 500 })
      .then((r) => {
        if (r.data?.status) {
          const data = r.data.data.data || r.data.data;
          store.commit("cadastros/setGruposProdutos", Array.isArray(data) ? data : []);
        }
      });
  }
});
</script>

<template>
  <TemplateAdmin>
    <div class="px-6 py-6 w-full h-full flex flex-col gap-4">
      <div
        class="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/40 overflow-hidden flex-1 flex flex-col"
      >
        <div class="p-8 flex-1 flex flex-col">
          <DataTable
            :columns="columns"
            :data="formattedProdutos"
            :loading="store.state.isSearching"
            :hideEditAction="!canManageProdutos"
            :hideStatusAction="!canManageProdutos"
            @search="handleSearch"
            @sort="handleSort"
            @view="handleView"
            @edit="handleEdit"
            @toggle-status="handleToggleStatus"
          >
            <!-- Actions Slot -->
            <template #actions>
              <!-- Filtro por Grupo -->
              <div class="flex items-center gap-2">
                <div class="flex items-center gap-1.5 text-slate-400">
                  <FilterIcon class="w-3.5 h-3.5" />
                </div>
                <Select
                  :model-value="filterGrupo || 'all'"
                  @update:model-value="handleFilterGrupo"
                >
                  <SelectTrigger
                    class="h-10 w-[180px] text-sm bg-slate-50 border-slate-100 rounded-xl"
                  >
                    <SelectValue placeholder="Grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Grupos</SelectItem>
                    <SelectItem
                      v-for="g in gruposParaFiltro"
                      :key="g.id"
                      :value="g.id.toString()"
                    >
                      {{ g.nome }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <!-- Filtro por Marca -->
              <div class="flex items-center gap-2" v-if="marcasParaFiltro.length > 0">
                <Select
                  :model-value="filterMarca || 'all'"
                  @update:model-value="handleFilterMarca"
                >
                  <SelectTrigger
                    class="h-10 w-[180px] text-sm bg-slate-50 border-slate-100 rounded-xl"
                  >
                    <SelectValue placeholder="Marca" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Marcas</SelectItem>
                    <SelectItem
                      v-for="m in marcasParaFiltro"
                      :key="m"
                      :value="m"
                    >
                      {{ m }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <LinkModal01
                v-if="isAdmin"
                label="CADASTRAR PRODUTO"
                :titleModal="titleModal"
                :varsModalData="varsModalData"
                class="shrink-0"
              />
            </template>

            <!-- Custom Cell Templates -->
            <template #cell-status="{ item }">
              <Badge
                :variant="item.status === 'Ativo' ? 'default' : 'destructive'"
                class="font-black px-3.5 py-1 text-[10px] uppercase tracking-widest rounded-full"
              >
                {{ item.status }}
              </Badge>
            </template>

            <template #cell-codigo_simpas="{ item }">
              <span
                v-if="item.codigo_simpas"
                class="inline-block font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200"
                :title="`Código SIMPAS: ${item.codigo_simpas}`"
              >
                {{ formatarSimpas(item.codigo_simpas) }}
              </span>
              <span v-else class="text-xs text-slate-300 font-mono">—</span>
            </template>

            <template #cell-codigo_barras="{ item }">
              <span
                v-if="item.codigo_barras"
                class="inline-flex items-center gap-1 font-mono text-[11px] font-medium px-2 py-0.5 rounded bg-slate-50 text-slate-700 border border-slate-200"
                :title="`Código de Barras: ${item.codigo_barras}`"
              >
                <BarcodeIcon class="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {{ item.codigo_barras }}
              </span>
              <span v-else class="text-xs text-slate-300 font-mono">—</span>
            </template>

            <template #cell-nome="{ item }">
              <div class="flex flex-col">
                <span class="flex items-center gap-2">
                  <span
                    class="font-bold text-slate-800 text-sm tracking-tight"
                    >{{ item.nome }}</span
                  >
                  <Badge
                    v-if="item.controlado"
                    class="font-black px-2 py-0 text-[9px] uppercase tracking-widest rounded-full bg-amber-100 text-amber-700 hover:bg-amber-100"
                    :title="`Medicamento controlado — Portaria 344/98${item.lista_portaria ? ' • Lista ' + item.lista_portaria : ''}`"
                  >
                    Controlado{{ item.lista_portaria ? " · " + item.lista_portaria : "" }}
                  </Badge>
                </span>
                <span
                  class="text-[10px] text-slate-400 font-medium uppercase tracking-tighter"
                  >{{ item.id }} • SKU IDENTIFIER</span
                >
              </div>
            </template>

            <template #cell-marca="{ item }">
              <Badge
                variant="outline"
                class="border-slate-200 text-slate-500 font-bold text-[10px] px-2 py-0"
              >
                {{ item.marca }}
              </Badge>
            </template>

            <template #cell-grupo_produto="{ item }">
              <div class="flex items-center gap-2">
                <LayersIcon class="w-3.5 h-3.5 text-slate-300" />
                <span class="text-xs font-semibold text-slate-600">{{
                  item.grupo_produto
                }}</span>
              </div>
            </template>

            <template #cell-unidade_medida="{ item }">
              <div
                class="inline-flex px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-black text-[10px]"
              >
                {{ item.unidade_medida }}
              </div>
            </template>

            <!-- Empty State -->
            <template #empty>
              <div
                class="flex flex-col items-center justify-center py-24 gap-4"
              >
                <div class="relative">
                  <div
                    class="absolute inset-0 bg-primary/20 blur-3xl rounded-full"
                  ></div>
                  <div class="relative p-8 bg-white rounded-full shadow-xl">
                    <BoxSelectIcon class="w-16 h-16 text-slate-300" />
                  </div>
                </div>
                <div class="text-center max-w-sm">
                  <h3 class="text-slate-900 font-black text-xl">
                    Nenhum produto em catálogo
                  </h3>
                  <p class="text-slate-500 text-sm mt-2 leading-relaxed">
                    Sua lista de produtos está vazia. Comece adicionando novos
                    itens clicando no botão de cadastro.
                  </p>
                </div>
              </div>
            </template>
          </DataTable>
        </div>
      </div>

      <!-- Modals -->
      <ModalProdutos :functions="functions" />
      <ModalProdutosView
        v-model:open="isViewModalOpen"
        :item="viewingItem"
      />
      
      <!-- Modal de Confirmação -->
      <AlertDialog :open="isToggleDialogOpen" @update:open="v => isToggleDialogOpen = v">
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle class="text-slate-800">
              {{ itemToToggle?.status === 'Ativo' ? 'Inativar Produto' : 'Ativar Produto' }}
            </AlertDialogTitle>
            <AlertDialogDescription class="text-slate-500">
              Tem certeza que deseja
              <strong>{{ itemToToggle?.status === 'Ativo' ? 'inativar' : 'ativar' }}</strong>
              o produto <strong class="text-slate-700">"{{ itemToToggle?.nome }}"</strong>?
              <span v-if="itemToToggle?.status === 'Ativo'" class="block mt-2 text-amber-600 text-xs">
                Produtos inativos ficam ocultos nas solicitações e entradas.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter class="gap-2">
            <AlertDialogCancel @click="isToggleDialogOpen = false">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              @click="confirmToggleStatus"
              :class="itemToToggle?.status === 'Ativo' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'"
            >
              {{ itemToToggle?.status === 'Ativo' ? 'Inativar' : 'Ativar' }}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </TemplateAdmin>
</template>

<style scoped>
:deep(.data-table-container) {
  border: none;
  box-shadow: none;
  padding: 0;
}
</style>
