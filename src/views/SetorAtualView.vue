<script setup>
import { ref, onMounted, onUnmounted, provide, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import axios from "axios";
import TemplateAdmin from "@/views/roleAdmin/TemplateAdmin.vue";
import TabOverview from "@/components/setorAtual/TabOverview.vue";
import TabEstoque from "@/components/setorAtual/TabEstoque.vue";
import TabMovimentacoes from "@/components/setorAtual/TabMovimentacoes.vue";
import TabEntrada from "@/components/setorAtual/TabEntrada.vue";
import TabUsuarios from "@/components/setorAtual/TabUsuarios.vue";
import ModalSetor from "@/components/cadastros/ModalSetor.vue";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  InfoIcon,
  BoxesIcon,
  ArrowLeftRightIcon,
  DownloadIcon,
  UsersIcon,
  AlertTriangleIcon,
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

// Funções de carregamento
import functionsEstoque from "@/functions/cad_estoque";
import functionsMovimentacao from "@/functions/cad_movimentacao";
import functionsEntrada from "@/functions/cad_entradas";
import functionsSetor from "@/functions/cad_setores";
import functionsUsuarioSetor from "@/functions/cad_usuario_setor";
import { setorCookie } from "@/utils/setorCookie";

const route = useRoute();
const router = useRouter();
const store = useStore();

const setor = ref({});
const loading = ref(true);
const activeTab = ref("overview");
const showDeleteDialog = ref(false);
const modalSetorOpen = ref(false);

// Refs de dados para as abas
const estoqueItems = ref([]);
const resumoEstoque = ref({});
const setorEstoque = ref({});
const movimentacoesItems = ref([]);
const entradasItems = ref([]);
const usuariosItems = ref([]);

// Provide para as abas filhas
provide("setorAtualData", {
  estoqueItems,
  resumoEstoque,
  setorEstoque,
  movimentacoesItems,
  entradasItems,
  usuariosItems,
});

const context = {
  $axios: axios,
  $store: store,
  $toastr: undefined,
  estoqueItems,
  resumoEstoque,
  setorEstoque,
  movimentacoesItems,
  entradasItems,
  usuariosItems,
};
provide("setorAtualContext", context);

// Computeds de permissão
const isAdminUser = computed(() => {
  const user = store.state.user;
  if (!user) return false;
  if (user.is_super_admin || user.is_admin) return true;

  const list = usuariosItems.value || [];
  const found = list.find((u) => {
    const userId = u.usuario_id || u.user_id || u.id || u.usuario?.id;
    const perfil = (u.perfil || u.pivot?.perfil || "").toString().toLowerCase();
    return (
      userId === user.id &&
      (perfil.includes("admin") || perfil.includes("gerente"))
    );
  });
  return !!found || !!user.is_admin;
});

const isSolicitante = computed(() => {
  if (store.getters.isSuperAdmin) return false;
  const user = store.state.user;
  if (!user) return false;
  const list = usuariosItems.value || [];
  const found = list.find((u) => {
    const userId = u.usuario_id || u.user_id || u.id || u.usuario?.id;
    const perfil = (u.perfil || u.pivot?.perfil || "").toString().toLowerCase();
    return userId === user.id && perfil.includes("solicitante");
  });
  return !!found;
});

const isAlmoxarife = computed(() => {
  if (store.getters.isSuperAdmin) return false;
  const user = store.state.user;
  if (!user) return false;
  const list = usuariosItems.value || [];
  const found = list.find((u) => {
    const userId = u.usuario_id || u.user_id || u.id || u.usuario?.id;
    const perfil = (u.perfil || u.pivot?.perfil || "").toString().toLowerCase();
    return userId === user.id && (perfil === "almoxarife" || perfil.includes("almoxarife"));
  });
  if (found) return true;
  const userObj = user || {};
  return (
    (userObj.roles && userObj.roles.includes && userObj.roles.includes("almoxarife")) ||
    (userObj.perfil && userObj.perfil.toString().toLowerCase().includes("almoxarife"))
  );
});

const isCAF = computed(() => {
  const nome = setor.value?.nome?.toUpperCase() || "";
  return nome.includes("CAF") || nome.includes("FARMÁCIA CENTRAL") || nome.includes("FARMACIA CENTRAL");
});

// Sigilo de Estoque Seletivo:
// Admins e Almoxarifes sempre visualizam;
// Solicitantes só visualizam se o setor atual controlar estoque físico.
const exibirAbaEstoque = computed(() => {
  if (isAdminUser.value || isAlmoxarife.value || store.getters.isSuperAdmin || store.state.user?.is_super_admin) {
    return true;
  }
  return Boolean(setor.value?.estoque);
});

// Watchers de abas permitidas
watch([isSolicitante, exibirAbaEstoque], () => {
  if (isSolicitante.value) {
    const permitidas = ["overview"];
    if (exibirAbaEstoque.value) permitidas.push("estoque");
    if (!permitidas.includes(activeTab.value)) {
      activeTab.value = "overview";
    }
  } else if (!exibirAbaEstoque.value && activeTab.value === "estoque") {
    activeTab.value = "overview";
  }
});

watch([isAdminUser, isSolicitante, isAlmoxarife], () => {
  if (activeTab.value === "usuarios" && (!isAdminUser.value || isSolicitante.value || isAlmoxarife.value)) {
    activeTab.value = "overview";
  }
});

watch(
  () => route.query.tab,
  (newTab) => {
    let tab = newTab || "overview";
    if (tab === "estoque" && !exibirAbaEstoque.value) {
      tab = "overview";
    }
    if (tab === "usuarios" && (!isAdminUser.value || isSolicitante.value || isAlmoxarife.value)) {
      tab = "overview";
    }
    activeTab.value = tab;
  },
);

const changeTab = (tab) => {
  if (tab === "estoque" && !exibirAbaEstoque.value) {
    tab = "overview";
  }
  if (tab === "usuarios" && (!isAdminUser.value || isSolicitante.value || isAlmoxarife.value)) {
    tab = "overview";
  }
  activeTab.value = tab;
  router.replace({ query: { ...route.query, tab } });
};

const carregarDadosOperacionais = async () => {
  if (!setor.value.id) return;

  const ctx = { ...context, loading: false, setorId: setor.value.id };

  if (setor.value.estoque) {
    await functionsEstoque.listAll(ctx);
  } else {
    estoqueItems.value = [];
    resumoEstoque.value = {};
    setorEstoque.value = {};
  }
  await functionsMovimentacao.listAll(ctx);
  await functionsEntrada.listAll(ctx);
  if (functionsUsuarioSetor.listAll) await functionsUsuarioSetor.listAll(ctx);
};

const updateHeader = () => {
  const titles = {
    overview: {
      title: "Visão Geral do Polo",
      subtitle:
        "Informações detalhadas sobre o polo de atendimento e gestão.",
    },
    estoque: {
      title: "Gestão de Estoque Local",
      subtitle:
        "Controle as quantidades disponíveis e receba alertas de reposição.",
    },
    movimentacoes: {
      title: "Movimentações e Requisições",
      subtitle: "Histórico completo de entradas e saídas entre setores.",
    },
    entrada: {
      title: "Protocolos de Entrada",
      subtitle: "Histórico de suprimentos recebidos de fornecedores externos.",
    },
    usuarios: {
      title: "Equipe e Permissões",
      subtitle:
        "Gerencie quem tem acesso e quais as permissões neste setor específico.",
    },
  };
  const headerInfo = titles[activeTab.value] || titles.overview;
  store.commit("setPageHeader", headerInfo);
};

watch(activeTab, () => {
  updateHeader();
});

const loadSetorDetails = async () => {
  loading.value = true;
  // Resetar dados operacionais para garantir que o setor anterior não persista na tela
  estoqueItems.value = [];
  resumoEstoque.value = {};
  setorEstoque.value = {};
  movimentacoesItems.value = [];
  entradasItems.value = [];
  usuariosItems.value = [];

  const currentId =
    store.state.setorAtualId ||
    setorCookie.getSectorId() ||
    store.state.setorDetails?.id;
  
  if (currentId) {
    const result = await functionsSetor.buscarSetorPorId(currentId);
    if (result.success) {
      store.commit("setSetorDetails", result.data);
      setor.value = result.data;
    } else {
      setor.value = store.state.setorDetails || {};
    }
    await carregarDadosOperacionais();
  }
  
  loading.value = false;
  let initialTab = route.query.tab || "overview";
  if (initialTab === "estoque" && !exibirAbaEstoque.value) {
    initialTab = "overview";
  }
  if (initialTab === "usuarios" && (!isAdminUser.value || isSolicitante.value || isAlmoxarife.value)) {
    initialTab = "overview";
  }
  activeTab.value = initialTab;
  updateHeader();
};

const editarSetor = () => {
  store.commit("setModalData", { ...setor.value });
  store.commit("setModalFunction", "UP");
  store.commit("setModalOpen", true);
};

const confirmarExclusaoSetor = async () => {
  // Lógica de exclusão aqui
  showDeleteDialog.value = false;
};

// Watch para recarregar dados após atualização do setor
const isModalOpen = computed(() => store.state.modalData.isModalOpen);
const modalFunction = computed(() => store.state.modalData.modalFunction);
let modalWasOpen = false;

watch(isModalOpen, async (newValue, oldValue) => {
  
  if (oldValue === true && newValue === false && modalFunction.value === "UP") {
    console.log("🔄 Recarregando dados do setor após atualização...");
    await loadSetorDetails();
  }
});

onMounted(loadSetorDetails);

onUnmounted(() => {
  store.commit("clearPageHeader");
});
</script>

<template>
  <TemplateAdmin>
    <div class="px-6 py-6 w-full h-full flex flex-col gap-4">
      <!-- Loading State -->
      <div
        v-if="loading"
        class="flex-1 flex items-center justify-center min-h-[400px]"
      >
        <div class="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p class="text-slate-500 font-medium animate-pulse">
            Carregando polo...
          </p>
        </div>
      </div>

      <!-- Main Content -->
      <div v-else-if="setor.id" class="flex-1 flex flex-col gap-4">
        <Tabs :model-value="activeTab" @update:model-value="changeTab" class="w-full flex flex-col gap-4">
          <div
            class="bg-white p-1 rounded-xl border border-slate-200 shadow-sm inline-flex self-start"
          >
            <TabsList class="bg-transparent border-none">
              <TabsTrigger
                value="overview"
                class="gap-2 px-6 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all duration-300 rounded-lg"
              >
                <InfoIcon class="w-4 h-4" />
                <span class="hidden sm:inline">Visão Geral</span>
              </TabsTrigger>

              <TabsTrigger
                v-if="exibirAbaEstoque"
                value="estoque"
                class="gap-2 px-6 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all duration-300 rounded-lg"
              >
                <BoxesIcon class="w-4 h-4" />
                <span class="hidden sm:inline">Estoque</span>
              </TabsTrigger>

              <TabsTrigger
                v-if="!isSolicitante"
                value="movimentacoes"
                class="gap-2 px-6 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all duration-300 rounded-lg"
              >
                <ArrowLeftRightIcon class="w-4 h-4" />
                <span class="hidden sm:inline">Movimentações</span>
              </TabsTrigger>

              <TabsTrigger
                v-if="isCAF && !isSolicitante"
                value="entrada"
                class="gap-2 px-6 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all duration-300 rounded-lg"
              >
                <DownloadIcon class="w-4 h-4" />
                <span class="hidden sm:inline">Entrada</span>
              </TabsTrigger>

              <TabsTrigger
                v-if="!isSolicitante && !isAlmoxarife && isAdminUser"
                value="usuarios"
                class="gap-2 px-6 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 transition-all duration-300 rounded-lg"
              >
                <UsersIcon class="w-4 h-4" />
                <span class="hidden sm:inline">Equipe</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div class="flex-1">
            <TabsContent value="overview" class="mt-0">
              <TabOverview
                :setor="setor"
                @navigate="changeTab"
                @editar-setor="editarSetor"
                @excluir-setor="showDeleteDialog = true"
              />
            </TabsContent>

            <TabsContent v-if="exibirAbaEstoque" value="estoque" class="mt-0">
              <TabEstoque :readOnly="isSolicitante" @reload-estoque="carregarDadosOperacionais" />
            </TabsContent>

            <TabsContent value="movimentacoes" class="mt-0">
              <TabMovimentacoes :setorId="setor.id" />
            </TabsContent>

            <TabsContent value="entrada" class="mt-0">
              <TabEntrada
                :setorId="setor.id"
                @reload-estoque="carregarDadosOperacionais"
              />
            </TabsContent>

            <TabsContent v-if="!isSolicitante && !isAlmoxarife && isAdminUser" value="usuarios" class="mt-0">
              <TabUsuarios :setorId="setor.id" />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <!-- Sector Not Found -->
      <div
        v-else
        class="flex-1 flex flex-col items-center justify-center py-20 bg-slate-50/50 border border-slate-200 border-dashed rounded-3xl"
      >
        <div class="p-6 bg-white rounded-full shadow-sm mb-4">
          <AlertTriangleIcon class="w-12 h-12 text-amber-500" />
        </div>
        <h5 class="text-slate-800 font-bold text-lg">Polo não encontrado</h5>
        <p class="text-slate-500 text-sm max-w-xs text-center mt-2">
          Não foi possível carregar os detalhes deste polo. Por favor,
          verifique se você tem permissão de acesso.
        </p>
        <Button @click="router.push('/setores')" variant="outline" class="mt-6">
          Voltar para Lista de Setores
        </Button>
      </div>

      <!-- Modals -->
      <ModalSetor :functions="functionsSetor" />

      <AlertDialog
        :open="showDeleteDialog"
        @update:open="showDeleteDialog = $event"
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o setor "{{ setor.nome_exibicao || setor.nome }}"? Esta
              ação não pode ser desfeita e removerá todos os dados vinculados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              @click="confirmarExclusaoSetor"
              class="bg-destructive text-white hover:bg-destructive/90"
            >
              Sim, Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  </TemplateAdmin>
</template>

<style scoped>
/* Transições de conteúdo das abas */
.tabs-content {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

