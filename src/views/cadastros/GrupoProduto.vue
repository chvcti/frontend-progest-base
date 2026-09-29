<script setup>
import { computed, ref, onMounted, getCurrentInstance } from "vue";
import { useStore } from "vuex";
import LinkModal01 from "@/components/layouts/LinkModal01.vue";
import TemplateAdmin from "@/views/roleAdmin/TemplateAdmin.vue";
import ModalGrupoProduto from "@/components/cadastros/ModalGrupoProduto.vue";
import ModalGrupoProdutoView from "@/components/cadastros/ModalGrupoProdutoView.vue";
import DataTable from "@/components/ui/data-table/DataTable.vue";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LayersIcon, TagIcon, ShapesIcon, FilterIcon } from "lucide-vue-next";
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
import functions from "@/functions/cad_grupo_produto.js";

const store = useStore();
const { proxy } = getCurrentInstance();

const titleModal = "Grupos de Produtos";
const varsModalData = { status: "A", nome: "", tipo: "Material", controlado: false };

const columns = [
  { key: "id", label: "#", align: "center", sortable: true },
  { key: "nome", label: "Grupo / Categoria", sortable: true },
  { key: "tipo", label: "Classificação", sortable: true },
  { key: "status", label: "Status", align: "center", sortable: true },
];

// Estado de busca, ordenação e filtros
const searchQuery = ref("");
const sortBy = ref("nome");
const sortDir = ref("asc");
const filterTipo = ref("");
const filterControlado = ref("");

const listGrupoProdutos = computed(() => {
  const data = store.state.cadastros.listGrupoProdutos;
  return data?.data || data || [];
});

const pagination = computed(() => {
  const list = store.state.cadastros.listGrupoProdutos;
  if (list && list.current_page) {
    return {
      current_page: list.current_page,
      last_page: list.last_page,
      per_page: list.per_page,
      total: list.total,
    };
  }
  return null;
});

const listAll = (url = null) => {
  functions.listAll(
    {
      $axios: proxy.$axios,
      $store: store,
      $toastr: proxy.$toastr,
      search: searchQuery.value,
      sort_by: sortBy.value,
      sort_dir: sortDir.value,
      tipo: filterTipo.value,
      controlado: filterControlado.value,
    },
    url,
  );
};

const handleSearch = (query) => {
  searchQuery.value = query;
  listAll();
};

const handleSort = (key) => {
  if (sortBy.value === key) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  } else {
    sortBy.value = key;
    sortDir.value = "asc";
  }
  listAll();
};

const handleFilterTipo = (value) => {
  filterTipo.value = value === "all" ? "" : value;
  listAll();
};

const handleFilterControlado = (value) => {
  filterControlado.value = value === "all" ? "" : value;
  listAll();
};

const handlePaginate = (page) => {
  let url = typeof page === "number" ? `/grupoProduto/list?page=${page}` : page;
  listAll(url);
};

// Modal de visualização
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

onMounted(listAll);
</script>

<template>
  <TemplateAdmin>
    <div class="px-6 py-6 w-full h-full flex flex-col gap-4">
      <!-- Content Table -->
      <div
        class="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/40 overflow-hidden flex-1 flex flex-col"
      >
        <div class="p-8 flex-1 flex flex-col">
          <DataTable
            :columns="columns"
            :data="listGrupoProdutos"
            :loading="store.state.isSearching"
            :pagination="pagination"
            @search="handleSearch"
            @paginate="handlePaginate"
            @sort="handleSort"
            @view="handleView"
            @edit="handleEdit"
            @toggle-status="handleToggleStatus"
          >
            <!-- Actions Slot -->
            <template #actions>
              <!-- Filtro por Tipo -->
              <div class="flex items-center gap-2">
                <div class="flex items-center gap-1.5 text-slate-400">
                  <FilterIcon class="w-3.5 h-3.5" />
                </div>
                <Select
                  :model-value="filterTipo || 'all'"
                  @update:model-value="handleFilterTipo"
                >
                  <SelectTrigger
                    class="h-10 w-[180px] text-sm bg-slate-50 border-slate-100 rounded-xl"
                  >
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    <SelectItem value="Medicamento">Medicamento</SelectItem>
                    <SelectItem value="Material">Material</SelectItem>
                  </SelectContent>
                </Select>

                <!-- Filtro de medicamentos controlados -->
                <Select
                  :model-value="filterControlado || 'all'"
                  @update:model-value="handleFilterControlado"
                >
                  <SelectTrigger
                    class="h-10 w-[180px] text-sm bg-slate-50 border-slate-100 rounded-xl"
                  >
                    <SelectValue placeholder="Controle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Controlados e comuns</SelectItem>
                    <SelectItem value="1">Somente controlados</SelectItem>
                    <SelectItem value="0">Somente comuns</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <LinkModal01
                label="NOVA CATEGORIA"
                :titleModal="titleModal"
                :varsModalData="varsModalData"
                class="shrink-0"
              />
            </template>

            <template #cell-status="{ item }">
              <Badge
                :variant="item.status === 'Ativo' ? 'default' : 'destructive'"
                class="font-black px-4 py-1.5 text-[10px] uppercase tracking-widest rounded-full"
              >
                {{ item.status }}
              </Badge>
            </template>

            <template #cell-nome="{ item }">
              <div class="flex items-center gap-3">
                <div
                  class="w-2 h-2 rounded-full shrink-0"
                  :class="item.controlado ? 'bg-amber-500' : 'bg-primary/40'"
                ></div>
                <span class="font-bold text-slate-700 text-sm tracking-tight">
                  {{ item.nome }}
                </span>
                <Badge
                  v-if="item.controlado"
                  class="font-black px-2.5 py-0.5 text-[9px] uppercase tracking-widest rounded-full bg-amber-100 text-amber-700 hover:bg-amber-100"
                  title="Grupo de medicamentos controlados — Portaria SVS/MS 344/98"
                >
                  Controlado
                </Badge>
              </div>
            </template>

            <template #cell-tipo="{ item }">
              <div
                class="flex items-center gap-2 px-3 py-1 border rounded-lg w-fit"
                :class="
                  item.controlado
                    ? 'bg-amber-50 border-amber-100'
                    : 'bg-slate-50 border-slate-100'
                "
              >
                <ShapesIcon
                  class="w-3.5 h-3.5"
                  :class="item.controlado ? 'text-amber-500' : 'text-slate-400'"
                />
                <span
                  class="text-[11px] font-black uppercase"
                  :class="item.controlado ? 'text-amber-600' : 'text-slate-500'"
                >
                  {{ item.controlado ? item.tipo + " controlado" : item.tipo }}
                </span>
              </div>
            </template>

            <!-- Empty State -->
            <template #empty>
              <div
                class="flex flex-col items-center justify-center py-24 gap-4"
              >
                <div
                  class="p-8 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200"
                >
                  <TagIcon class="w-16 h-16 text-slate-300" />
                </div>
                <div class="text-center max-w-sm">
                  <h3 class="text-slate-900 font-black text-xl tracking-tight">
                    Sem categorias definidas
                  </h3>
                  <p
                    class="text-slate-500 text-sm mt-2 leading-relaxed font-medium"
                  >
                    Defina grupos para organizar seus medicamentos e materiais
                    de forma estruturada.
                  </p>
                </div>
              </div>
            </template>
          </DataTable>
        </div>
      </div>

      <!-- Modals -->
      <ModalGrupoProduto :functions="functions" />
      <ModalGrupoProdutoView
        v-model:open="isViewModalOpen"
        :item="viewingItem"
      />

      <!-- Modal de Confirmação -->
      <AlertDialog :open="isToggleDialogOpen" @update:open="v => isToggleDialogOpen = v">
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle class="text-slate-800">
              {{ itemToToggle?.status === 'Ativo' ? 'Inativar Grupo' : 'Ativar Grupo' }}
            </AlertDialogTitle>
            <AlertDialogDescription class="text-slate-500">
              Tem certeza que deseja
              <strong>{{ itemToToggle?.status === 'Ativo' ? 'inativar' : 'ativar' }}</strong>
              o grupo <strong class="text-slate-700">"{{ itemToToggle?.nome }}"</strong>?
              <span v-if="itemToToggle?.status === 'Ativo'" class="block mt-2 text-amber-600 text-xs">
                Grupos inativos ficam ocultos na seleção ao cadastrar produtos.
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
  @apply border-none shadow-none p-0;
}
</style>
