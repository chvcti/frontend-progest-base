<template>
  <TemplateAdmin>
    <div class="max-w-7xl mx-auto space-y-6">
      <!-- Loading -->
      <div
        v-if="loading"
        class="flex flex-col items-center justify-center py-12"
      >
        <LoadingSpinner size="lg" />
        <p class="text-muted-foreground mt-3">Carregando...</p>
      </div>

      <!-- Conteúdo -->
      <div v-else-if="setor.id" class="w-full">
        <Tabs :value="activeTab" @update:value="changeTab" class="w-full">
          <TabsList class="grid w-full grid-cols-2 mb-6 bg-slate-100/50 p-1 rounded-lg">
            <TabsTrigger value="overview" class="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-md">
              <InfoIcon class="w-4 h-4 mr-2 inline-block" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger v-if="setor.estoque && (!isSolicitante || isSuperAdmin)" value="estoque" class="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm rounded-md">
              <PackageIcon class="w-4 h-4 mr-2 inline-block" />
              Estoque
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <TabOverview
              :setor="setor"
              :readOnly="true"
              @navigate="changeTab"
            />
          </TabsContent>

          <TabsContent value="estoque" v-if="setor.estoque && (!isSolicitante || isSuperAdmin)">
            <TabEstoque :readOnly="true" />
          </TabsContent>
        </Tabs>
      </div>

      <!-- Setor não encontrado -->
      <div v-else class="flex flex-col items-center justify-center py-12 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertTriangleIcon class="w-12 h-12 text-amber-500 mb-4" />
        <h3 class="text-xl font-semibold text-amber-700">
          Setor não encontrado
        </h3>
        <p class="text-amber-600/80 mt-2">O setor que você tentou acessar não existe ou você não tem permissão.</p>
      </div>
    </div>
  </TemplateAdmin>
</template>

<script setup>
import { ref, onMounted, onUnmounted, provide, watch, computed } from "vue";
import { useRoute } from "vue-router";
import { useStore } from "vuex";
import TemplateAdmin from "@/views/roleAdmin/TemplateAdmin.vue";
import TabOverview from "@/components/setorAtual/TabOverview.vue";
import TabEstoque from "@/components/setorAtual/TabEstoque.vue";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { InfoIcon, PackageIcon, AlertTriangleIcon } from "lucide-vue-next";

// Importar functions para carregar dados
import functionsEstoque from "@/functions/cad_estoque";
import functionsSetor from "@/functions/cad_setores";
import axios from "axios";

const route = useRoute();
const store = useStore();

const setor = ref({});
const loading = ref(true);
const activeTab = ref("overview");

const isSolicitante = computed(() => {
  if (store.getters["auth/isSuperAdmin"]) return false;
  const user = store.state.auth.user;
  if (!user) return false;
  const list = store.state.estoque.listUsuariosSetor || [];
  const found = list.find((u) => {
    const userId = u.usuario_id || u.user_id || u.id || u.usuario?.id;
    const perfil = (u.perfil || u.pivot?.perfil || "").toString().toLowerCase();
    return userId === user.id && perfil.includes("solicitante");
  });
  return !!found;
});

const isSuperAdmin = computed(() => {
  return store.getters["auth/isSuperAdmin"];
});

// Dados compartilhados via provide
const estoqueItems = ref([]);
const resumoEstoque = ref({});
const setorEstoque = ref({});

provide("setorAtualData", {
  estoqueItems,
  resumoEstoque,
  setorEstoque,
  // Movimentações e entradas não são necessárias aqui, mas mantemos interface compatível se precisar
  movimentacoesItems: ref([]),
  entradasItems: ref([]),
  usuariosItems: ref([]),
});

// Contexto simplificado
const setorAtualContext = {
  $axios: axios,
  $store: store,
  $toastr: undefined,
};

provide("setorAtualContext", setorAtualContext);

const changeTab = (tab) => {
  if (tab === "overview" || tab === "estoque") {
    activeTab.value = tab;
  }
};

const carregarDadosDoSetor = async (setorId) => {
  try {
    loading.value = true;
    activeTab.value = "overview"; // reset imediato antes do carregamento
    console.log(`Carregando dados do setor consumidor ${setorId}...`);

    // 1. Buscar detalhes do setor
    const responseSetor = await functionsSetor.buscarSetorPorId(setorId);

    if (responseSetor.success) {
      setor.value = responseSetor.data;

      store.commit("setPageHeader", {
        title: `Visualizando: ${setor.value.nome}`,
        subtitle: "Modo de visualização (Apenas Leitura)",
      });

      // 2. Carregar estoque se necessário
      if (setor.value.estoque) {
        const context = {
          $axios: axios,
          $store: store,
          $toastr: undefined,
          modalData: {},
          estoqueData: {},
          estoqueItems: estoqueItems,
          resumoEstoque: resumoEstoque,
          setorEstoque: setorEstoque,
          loading: false,
          error: null,
        };

        try {
          const result = await functionsEstoque.listEstoqueUnidade(
            context,
            setorId,
          );

          if (result && result.status && result.data) {
            const data = result.data;
            estoqueItems.value = data.estoque || [];
            resumoEstoque.value = data.resumo || {};
            setorEstoque.value = data.polo || data.unidade || data.setor || {};
          }

          console.log(
            "Estoque carregado para setor consumidor (via retorno):",
            estoqueItems.value.length,
          );
        } catch (e) {
          console.error("Erro ao carregar estoque do setor consumidor", e);
        }
      }
    } else {
      console.error("Erro ao buscar setor:", responseSetor.message);
    }
  } catch (error) {
    console.error("Erro geral ao carregar setor consumidor:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  const setorId = route.params.id;
  if (setorId) {
    activeTab.value = "overview";
    carregarDadosDoSetor(setorId);
  }
});

onUnmounted(() => {
  store.commit("clearPageHeader");
});

  watch(
  () => route.params.id,
  (newId) => {
    if (newId) {
      activeTab.value = "overview";
      carregarDadosDoSetor(newId);
    }
  },
);
</script>
