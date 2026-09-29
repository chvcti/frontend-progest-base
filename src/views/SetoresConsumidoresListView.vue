<template>
  <TemplateAdmin>
    <div class="max-w-7xl mx-auto space-y-6">
      
      <!-- Filters & Search -->
      <Card>
        <CardContent class="p-4">
          <div class="flex flex-col md:flex-row gap-4 items-center">
            <div class="flex-1 flex items-center gap-2 w-full">
              <Input
                v-model="searchTerm"
                placeholder="Pesquisar setor por nome..."
                class="flex-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center justify-center py-12">
        <LoadingSpinner size="lg" />
        <p class="text-muted-foreground mt-3">
          {{ loadingMessage || "Carregando setores..." }}
        </p>
      </div>

      <!-- List of Sectors -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          v-for="setor in filteredSetores"
          :key="setor.id"
          class="h-full hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500"
          @click="navigateToSetor(setor.id)"
        >
          <CardContent class="p-6">
            <div class="flex items-start justify-between mb-2">
              <div class="flex items-center gap-4">
                <div class="p-3 bg-blue-50 rounded-lg">
                  <StoreIcon class="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h5 class="font-bold text-lg mb-1 text-slate-800">{{ setor.nome_exibicao || setor.nome }}</h5>
                  <p class="text-sm text-slate-500">
                    {{ setor.polo?.nome || "Polo não informado" }}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Empty State -->
        <div
          v-if="filteredSetores.length === 0"
          class="col-span-full py-12 flex flex-col items-center justify-center bg-white rounded-lg border border-dashed border-slate-300"
        >
          <StoreIcon class="w-12 h-12 text-slate-300 mb-4" />
          <h3 class="text-xl font-semibold text-slate-700">
            Nenhum setor encontrado
          </h3>
          <p class="text-slate-500 mt-2">Tente ajustar sua pesquisa.</p>
        </div>
      </div>
    </div>
  </TemplateAdmin>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import axios from "axios";
import { API_URL } from "@/config";
import TemplateAdmin from "@/views/roleAdmin/TemplateAdmin.vue";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { StoreIcon } from "lucide-vue-next";

const router = useRouter();
const store = useStore();

const loading = ref(true);
const setores = ref([]);
const searchTerm = ref("");
const loadingMessage = ref("Carregando setores...");

const filteredSetores = computed(() => {
  let result = setores.value;
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase();
    result = result.filter((s) => s.nome.toLowerCase().includes(term));
  }
  return result;
});

const loadSetoresConsumidores = async () => {
  loading.value = true;
  loadingMessage.value = "Buscando setores...";
  const setorDetails = store.state.estoque.setorDetails;

  if (!setorDetails || !setorDetails.id) {
    loading.value = false;
    return;
  }

  try {
    const response = await axios.post(
      `/setores/listConsumers`,
      { id: setorDetails.id },
      { headers: { Authorization: `Bearer ${store.getters["auth/getUserToken"]}` } }
    );

    if (response.data.status && response.data.data) {
      setores.value = response.data.data;
    }
  } catch (error) {
    console.error("Erro ao carregar setores consumidores:", error);
  } finally {
    loading.value = false;
  }
};

const navigateToSetor = (setorId) => {
  router.push(`/setores-consumidores/${setorId}`);
};

onMounted(() => {
  store.commit("setPageHeader", {
    title: "Setores Consumidores",
    subtitle: "Visualize e gerencie os polos e setores que recebem suprimentos.",
  });
  loadSetoresConsumidores();
});

onUnmounted(() => {
  store.commit("clearPageHeader");
});
</script>

