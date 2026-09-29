<template>
  <div
    class="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800"
  >
    <!-- Botão de logout flutuante sempre visível como fallback -->
    <button
      @click="logout"
      class="fixed top-4 right-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md shadow-lg transition-colors z-50"
      title="Fazer logout"
    >
      Sair
    </button>

    <Card class="w-full max-w-md shadow-2xl border-0">
      <!-- Loading State -->
      <template v-if="loading">
        <CardHeader class="text-center">
          <CardTitle class="text-xl">Carregando...</CardTitle>
        </CardHeader>
        <CardContent
          class="w-full min-h-[300px] flex items-center justify-center"
        >
          <LoadingSpinner size="lg" />
        </CardContent>
      </template>

      <!-- Error State -->
      <template v-else-if="errorMessage">
        <CardHeader>
          <CardTitle class="text-red-600">Erro</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div
            class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm"
          >
            <span class="mr-2">⚠️</span>{{ errorMessage }}
          </div>
          <div class="space-y-2">
            <Button @click="carregarSetores" class="w-full h-10">
              Tentar Novamente
            </Button>
            <Button @click="logout" variant="destructive" class="w-full h-10">
              Fazer Logout
            </Button>
          </div>
        </CardContent>
      </template>

      <!-- No Sectors Available -->
      <template v-else-if="setores.length === 0">
        <CardHeader>
          <CardTitle class="text-yellow-600">Nenhum Setor</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div
            class="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md text-sm"
          >
            <span class="mr-2">⚠️</span>Você não tem acesso a nenhum setor no
            momento. Fale com o administrador para vincular um setor à sua
            conta.
          </div>
          <div v-if="isGlobalAdmin" class="pt-2 border-t mt-4 space-y-2">
            <p class="text-sm text-slate-600 font-medium">Modo Administrador Global</p>
            <Button @click="$router.push('/polos')" class="w-full h-10 bg-indigo-600 hover:bg-indigo-700">
              Configurar Sistema (Cadastros Básicos)
            </Button>
          </div>
          <Button @click="logout" variant="destructive" class="w-full h-10">
            Fazer Logout
          </Button>
        </CardContent>
      </template>

      <!-- Sector Selection Form -->
      <template v-else>
        <CardHeader class="space-y-2">
          <CardTitle class="text-2xl font-bold text-center">
            Acesso ao Sistema
          </CardTitle>
          <CardDescription class="text-center">
            Selecione o polo e o setor para continuar
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form @submit.prevent="selecionarSetor" class="space-y-6">
            <!-- Polo Select -->
            <div class="space-y-2">
              <label
                for="polo-select"
                class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Polo <span class="text-red-600">*</span>
              </label>
              <Select
                v-model="poloSelecionado"
                @update:modelValue="onPoloChange"
              >
                <SelectTrigger id="polo-select" class="h-10">
                  <SelectValue placeholder="-- Selecione um polo --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem
                      v-for="polo in polos"
                      :key="polo.id"
                      :value="polo.id.toString()"
                    >
                      {{ polo.nome }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <!-- Setor Select -->
            <div class="space-y-2">
              <label
                for="setor-select"
                class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Setor <span class="text-red-600">*</span>
              </label>
              <Select
                v-model="setorSelecionado"
                :disabled="!poloSelecionado"
              >
                <SelectTrigger id="setor-select" class="h-10">
                  <SelectValue
                    :placeholder="
                      poloSelecionado
                        ? '-- Selecione um setor --'
                        : 'Selecione primeiro o polo'
                    "
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem
                      v-for="setor in setoresFiltrados"
                      :key="setor.id"
                      :value="setor.id.toString()"
                    >
                      {{ setor.nome_exibicao || setor.nome }}
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <div v-if="erroValidacao" class="text-red-500 text-xs mt-1">
                {{ erroValidacao }}
              </div>
            </div>

            <!-- Setor Info Card -->
            <div
              v-if="setorSelecionado && getSetorSelecionado"
              class="bg-blue-50 border border-blue-200 rounded-md p-4"
            >
              <p class="text-sm text-gray-700">
                <strong>Polo:</strong> {{ getSetorSelecionado.polo.nome }}
              </p>
              <p class="text-sm text-gray-700 mt-1">
                <strong>Setor:</strong> {{ getSetorSelecionado.nome }}
              </p>
              <p
                v-if="getSetorSelecionado.descricao"
                class="text-sm text-gray-700 mt-2"
              >
                <strong>Descrição:</strong> {{ getSetorSelecionado.descricao }}
              </p>
            </div>

            <!-- Buttons -->
            <div class="flex gap-3 pt-4">
              <Button
                type="submit"
                class="flex-1 h-10"
                :disabled="!setorSelecionado || loadingEntrada"
              >
                {{ loadingEntrada ? "Entrando..." : "Entrar" }}
              </Button>
              <Button
                type="button"
                @click="logout"
                variant="outline"
                class="flex-1 h-10"
              >
                Sair
              </Button>
            </div>
          </form>
        </CardContent>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import axios from "axios";
import { setorCookie } from "@/utils/setorCookie";
import functions from "@/functions/cad_setores";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

const router = useRouter();
const store = useStore();

const setores = ref([]);
const poloSelecionado = ref("");
const setorSelecionado = ref("");
const loading = ref(true);
const loadingEntrada = ref(false);
const errorMessage = ref("");
const erroValidacao = ref("");

const polos = computed(() => {
  const map = new Map();
  setores.value.forEach((s) => {
    if (s.polo && (s.polo.status === 'A' || s.polo.status === 'Ativo') && !map.has(s.polo.id)) {
      map.set(s.polo.id, s.polo);
    }
  });
  return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
});

const isGlobalAdmin = computed(() => {
  const user = store.state.auth.user;
  return Boolean(user && user.is_super_admin);
});

const setoresFiltrados = computed(() => {
  if (!poloSelecionado.value) return [];
  return setores.value
    .filter((s) => s.polo_id == poloSelecionado.value)
    .sort((a, b) => a.nome.localeCompare(b.nome));
});

const onPoloChange = () => {
  setorSelecionado.value = "";
  erroValidacao.value = "";

  // Se houver apenas um setor para este polo, selecionar automaticamente
  if (setoresFiltrados.value.length === 1) {
    setorSelecionado.value = setoresFiltrados.value[0].id.toString();
  }
};

const getSetorSelecionado = computed(() => {
  if (!setorSelecionado.value) return null;
  return setores.value.find((s) => s.id == setorSelecionado.value);
});

const carregarSetores = async () => {
  try {
    loading.value = true;
    errorMessage.value = "";

    console.log("🔄 Iniciando carregamento de setores...");

    const context = {
      $axios: axios,
      $store: store,
      $toastr: undefined,
      modalData: {},
    };

    const resultado = await functions.getSetoresWithAccess(context);

    console.log("✅ Resultado da chamada getSetoresWithAccess:", resultado);

    if (resultado.success && resultado.data && resultado.data.length > 0) {
      console.log("✓ Setores retornados da API:", resultado.data.length);

      const user = store.state.auth.user;
      const isSuperAdmin = Boolean(user && user.is_super_admin);

      if (isSuperAdmin) {
        // Super Admin tem acesso a todos os setores do hospital
        setores.value = resultado.data;
      } else {
        // Usuários comuns, administradores de setor (incluindo CAF) ou polos:
        // DEVEM listar estritamente os setores aos quais possuem vínculo em usuario_setor
        const token = store.getters["auth/getUserToken"] || sessionStorage.getItem("token") || localStorage.getItem("token");
        let vinculosIds = [];

        if (Array.isArray(user?.setores) && user.setores.length > 0) {
          vinculosIds = user.setores.map((s) => Number(s.id || s.setor_id)).filter(Boolean);
        }

        if (user?.id) {
          try {
            const resp = await axios.post(
              "/usuarioSetor/listByUsuario",
              { usuario_id: user.id },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (resp.data?.status && Array.isArray(resp.data?.data)) {
              const idsApi = resp.data.data
                .map((v) => Number(v.setor_id || v.id || v.setor?.id))
                .filter(Boolean);
              vinculosIds = [...new Set([...vinculosIds, ...idsApi])];
            }
          } catch (e) {
            console.warn("Erro ao buscar vínculos de usuario_setor:", e);
          }
        }

        const allowedSet = new Set(vinculosIds);
        setores.value = resultado.data.filter((s) =>
          allowedSet.has(Number(s.id))
        );
      }

      // Auto-selecionar polo se houver apenas um
      if (polos.value.length === 1) {
        poloSelecionado.value = polos.value[0].id.toString();
        // Disparar lógica de mudança de polo (isso vai auto-selecionar o setor se houver apenas um também)
        onPoloChange();
      }
    } else if (!resultado.success) {
      console.warn("⚠️ Falha na API ao carregar setores");
      errorMessage.value =
        "Erro ao conectar com o servidor. Verifique sua conexão e tente novamente.";
      setores.value = [];
    } else {
      console.warn(
        "⚠️ Usuário não tem acesso a nenhum setor (resultado vazio)",
      );
      errorMessage.value = "";
      setores.value = [];
    }
  } catch (error) {
    console.error("❌ Erro ao carregar setores:", error);
    errorMessage.value =
      "Erro inesperado ao carregar setores. Tente novamente.";
    setores.value = [];
  } finally {
    loading.value = false;
    console.log("🔽 Carregamento finalizado. Estado:", {
      loading: loading.value,
      setores: setores.value.length,
      errorMessage: errorMessage.value,
    });
  }
};

const selecionarSetor = async () => {
  if (!setorSelecionado.value) {
    erroValidacao.value = "Por favor, selecione um setor";
    return;
  }

  erroValidacao.value = "";
  loadingEntrada.value = true;

  try {
    const setor = getSetorSelecionado.value;
    if (!setor) {
      erroValidacao.value = "Setor não encontrado";
      return;
    }

    // Salvar setor nos cookies
    setorCookie.setSector(setor.id, setor.nome);

    // Atualizar estado do Vuex
    store.commit("estoque/setSetorAtual", {
      id: setor.id,
      nome: setor.nome,
    });

    // Carregar detalhes completos do setor
    const context = {
      $axios: axios,
      $store: store,
      $toastr: undefined,
      modalData: {},
    };

    const resultadoDetalhes = await functions.getSetorDetail(context, setor.id);

    if (!resultadoDetalhes.success) {
      // Não impede o acesso ao dashboard mesmo sem detalhes
    }

    // Redirecionar para dashboard
    router.push("/dashboard");
  } catch (error) {
    console.error("Erro ao selecionar setor:", error);
    erroValidacao.value = "Erro ao selecionar setor. Tente novamente.";
  } finally {
    loadingEntrada.value = false;
  }
};

const logout = () => {
  try {
    console.log("🚪 Iniciando logout...");

    // Limpar dados de autenticação
    try {
      store.commit("auth/clearUserToken");
      console.log("✓ Token limpo");
    } catch (e) {
      console.warn("⚠️ Erro ao limpar token:", e);
    }

    try {
      store.commit("auth/setUser", null);
      console.log("✓ Usuário limpo");
    } catch (e) {
      console.warn("⚠️ Erro ao limpar usuário:", e);
    }

    // Limpar dados do setor
    try {
      store.commit("estoque/clearSetorAtual");
      console.log("✓ Setor Atual limpo");
    } catch (e) {
      console.warn("⚠️ Erro ao limpar setor atual:", e);
    }

    try {
      store.commit("estoque/clearSetorDetails");
      console.log("✓ Detalhes do setor limpos");
    } catch (e) {
      console.warn("⚠️ Erro ao limpar detalhes do setor:", e);
    }

    try {
      setorCookie.clearSector();
      console.log("✓ Cookies do setor limpos");
    } catch (e) {
      console.warn("⚠️ Erro ao limpar cookies:", e);
    }

    // Limpar sessionStorage e localStorage
    try {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      console.log("✓ Armazenamento de sessão limpo");
    } catch (e) {
      console.warn("⚠️ Erro ao limpar armazenamento:", e);
    }

    console.log(
      "✅ Logout concluído com sucesso, redirecionando para login...",
    );

    // Redirecionar para login
    router.push("/login").then(() => {
      console.log("✓ Redirecionado para /login");
    });
  } catch (error) {
    console.error("❌ Erro crítico durante logout:", error);
    // Fallback: redirecionar mesmo se houver erro
    window.location.href = "/login";
  }
};

onMounted(() => {
  console.log("📱 SetorSelectionView montado");
  // Verificar se está autenticado
  const token = store.getters["auth/getUserToken"];
  console.log("🔑 Token verificado:", token ? "✓ Presente" : "✗ Ausente");

  if (!token) {
    console.log("⚠️ Sem token de autenticação, redirecionando para login");
    router.push("/login");
    return;
  }

  console.log("✓ Usuário autenticado, carregando setores...");
  // Carregar setores disponíveis
  carregarSetores();
});
</script>

