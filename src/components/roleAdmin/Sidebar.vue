<template>
  <aside
    v-show="!modoRelatorios"
    :class="`sidebar ${is_expanded ? 'is-expanded' : ''}`"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Logo Section -->
    <router-link class="logo-section" to="/home" title="Ir para a tela inicial">
      <img
        :src="currentLogoSrc"
        :alt="is_expanded ? unidadeNome : 'ProGest HGVC Logo'"
        class="logo-image"
      />
    </router-link>

    <!-- Menu Principal -->
    <nav class="menu-section">
      <!-- Dashboard desativado temporariamente -->
      <router-link class="menu-item" to="/home" title="Tela Inicial">
        <span class="material-icons menu-icon">home</span>
        <span class="menu-text">Tela Inicial</span>
      </router-link>
    </nav>

    <!-- Divider -->
    <div class="menu-divider"></div>

    <!-- Main Menu -->
    <nav class="menu-section">
      <!-- When user is a solicitante in the current sector show only the solicitante pages -->
      <template v-if="isSolicitante">
        <router-link
          class="menu-item"
          to="/setor-atual?tab=overview"
          :title="setorAtualNome"
          active-class="no-active" exact-active-class="no-active" :class="{ 'router-link-active router-link-exact-active': !$route.query.tab || $route.query.tab === 'overview' }"
        >
          <span class="material-icons menu-icon">apartment</span>
          <span class="menu-text">{{ setorAtualNome }}</span>
        </router-link>

        <router-link
          v-if="setorTemEstoque"
          class="menu-item"
          to="/setor-atual?tab=estoque"
          title="Estoque Local"
          active-class="no-active" exact-active-class="no-active" :class="{ 'router-link-active router-link-exact-active': $route.query.tab === 'estoque' }"
        >
          <span class="material-icons menu-icon">inventory</span>
          <span class="menu-text">Estoque Local</span>
        </router-link>

        <router-link v-if="!isCAF" class="menu-item" to="/pedidos?tab=itens" title="Pedidos">
          <span class="material-icons menu-icon">shopping_cart</span>
          <span class="menu-text">Pedidos</span>
        </router-link>
      </template>

      <!-- Default admin/management menu -->
      <template v-else>
        <router-link
          class="menu-item"
          to="/setor-atual?tab=overview"
          :title="setorAtualNome"
          active-class="no-active" exact-active-class="no-active" :class="{ 'router-link-active router-link-exact-active': !$route.query.tab || $route.query.tab === 'overview' }"
        >
          <span class="material-icons menu-icon">apartment</span>
          <span class="menu-text">{{ setorAtualNome }}</span>
        </router-link>

        <router-link
          v-if="setorTemEstoque"
          class="menu-item"
          to="/setor-atual?tab=estoque"
          title="Estoque Local"
          active-class="no-active" exact-active-class="no-active" :class="{ 'router-link-active router-link-exact-active': $route.query.tab === 'estoque' }"
        >
          <span class="material-icons menu-icon">inventory</span>
          <span class="menu-text">Estoque Local</span>
        </router-link>

        <router-link
          class="menu-item"
          to="/setor-atual?tab=movimentacoes"
          title="Movimentações"
          active-class="no-active" exact-active-class="no-active" :class="{ 'router-link-active router-link-exact-active': $route.query.tab === 'movimentacoes' && !$route.query.status && !$route.query.tipo }"
        >
          <span class="material-icons menu-icon">swap_horiz</span>
          <span class="menu-text">Movimentações</span>
        </router-link>

        <router-link
          class="menu-item"
          to="/setor-atual?tab=movimentacoes&tipo=saida"
          title="Saídas"
          active-class="no-active" exact-active-class="no-active" :class="{ 'router-link-active router-link-exact-active': $route.query.tab === 'movimentacoes' && $route.query.tipo === 'saida' }"
        >
          <span class="material-icons menu-icon">arrow_upward</span>
          <span class="menu-text">Saídas</span>
        </router-link>

        <router-link
          class="menu-item"
          to="/setor-atual?tab=movimentacoes&tipo=entrada"
          title="Entradas"
          active-class="no-active" exact-active-class="no-active" :class="{ 'router-link-active router-link-exact-active': $route.query.tab === 'movimentacoes' && $route.query.tipo === 'entrada' }"
        >
          <span class="material-icons menu-icon">arrow_downward</span>
          <span class="menu-text">Entradas</span>
        </router-link>

        <router-link
          class="menu-item"
          to="/setor-atual?tab=movimentacoes&status=P"
          title="Movimentações Pendentes"
          active-class="no-active" exact-active-class="no-active" :class="{ 'router-link-active router-link-exact-active': $route.query.tab === 'movimentacoes' && $route.query.status === 'P' }"
        >
          <span class="menu-icon-wrapper">
            <span class="material-icons menu-icon">pending_actions</span>
            <span v-if="solicitacoesPendentes > 0" class="badge-pendentes">
              {{ solicitacoesPendentes > 99 ? "99+" : solicitacoesPendentes }}
            </span>
          </span>
          <span class="menu-text">Movimentações Pendentes</span>
        </router-link>

        <router-link
          v-if="isCAF && (isAdminPerfil || isAdminUser)"
          class="menu-item"
          to="/setor-atual?tab=entrada"
          title="Registrar Entrada"
          active-class="no-active" exact-active-class="no-active" :class="{ 'router-link-active router-link-exact-active': $route.query.tab === 'entrada' }"
        >
          <span class="material-icons menu-icon">arrow_circle_down</span>
          <span class="menu-text">Registrar Entrada</span>
        </router-link>

        <router-link 
          v-if="!isCAF"
          class="menu-item" 
          to="/pedidos?tab=itens" 
          title="Pedidos"
        >
          <span class="material-icons menu-icon">shopping_cart</span>
          <span class="menu-text">Pedidos</span>
        </router-link>

        <router-link
          v-if="!isSolicitante && !isAlmoxarifePerfil && (isAdminUser || isAdminPerfil || isAdminPolo)"
          class="menu-item"
          to="/setor-atual?tab=usuarios"
          title="Equipe"
          active-class="no-active" exact-active-class="no-active" :class="{ 'router-link-active router-link-exact-active': $route.query.tab === 'usuarios' }"
        >
          <span class="material-icons menu-icon">group</span>
          <span class="menu-text">Equipe</span>
        </router-link>

        <router-link
          v-if="setoresConsumidores.length > 0 && !isSolicitante && !isAlmoxarifePerfil && (isAdminUser || isAdminPerfil || isAdminPolo)"
          class="menu-item"
          to="/setores-consumidores"
          title="Setores Consumidores"
        >
          <span class="material-icons menu-icon">store</span>
          <span class="menu-text">Setores Consumidores</span>
        </router-link>

        <!-- Submenu: Cadastros -->
        <!-- Visível apenas para administradores. Oculto para almoxarife e solicitante independente do setor. -->
        <div v-if="!isAlmoxarifePerfil && !isSolicitante && (isAdminUser || isAdminPerfil || isAdminPolo)" class="submenu-section">
          <button
            class="menu-item submenu-toggle"
            @click="toggleSubmenu"
            title="Mais Cadastros"
          >
            <span class="material-icons menu-icon">add_circle_outline</span>
            <span class="menu-text">Cadastros</span>
            <span
              class="material-icons expand-icon"
              :class="{ open: submenuOpen }"
            >
              expand_more
            </span>
          </button>

          <!-- Submenu Items -->
          <transition name="submenu-transition">
            <div v-show="submenuOpen" class="submenu-items">
              <!-- Produtos: apenas admin (super admin ou admin do setor) -->
              <router-link
                v-if="isAdminUser || (isCAF && isAdminPerfil)"
                class="submenu-item"
                to="/produtos"
                title="Produtos"
              >
                <span class="material-icons menu-icon">category</span>
                <span class="menu-text">Produtos</span>
              </router-link>

              <!-- Fornecedores: apenas admin (super admin ou admin do setor) -->
              <router-link
                v-if="isAdminUser || (isCAF && isAdminPerfil)"
                class="submenu-item"
                to="/fornecedores"
                title="Fornecedores"
              >
                <span class="material-icons menu-icon">business_center</span>
                <span class="menu-text">Fornecedores</span>
              </router-link>

              <!-- Polos: só super admin -->
              <router-link
                v-if="isSuperAdmin"
                class="submenu-item"
                to="/polos"
                title="Polos"
              >
                <span class="material-icons menu-icon">map</span>
                <span class="menu-text">Polos</span>
              </router-link>

              <!-- Setores: super admin, admin da CAF ou admin polo -->
              <router-link
                v-if="isAdminUser || (isCAF && isAdminPerfil) || isAdminPolo"
                class="submenu-item"
                to="/setores"
                title="Setores"
              >
                <span class="material-icons menu-icon">domain</span>
                <span class="menu-text">Setores</span>
              </router-link>

              <!-- Grupos de Produtos: apenas admin (super admin ou admin do setor) -->
              <router-link
                v-if="isAdminUser || (isCAF && isAdminPerfil)"
                class="submenu-item"
                to="/grupoProduto"
                title="Grupos de Produtos"
              >
                <span class="material-icons menu-icon">label</span>
                <span class="menu-text">Grupos de Produtos</span>
              </router-link>

              <!-- Unidades de Medida: apenas admin (super admin ou admin do setor) -->
              <router-link
                v-if="isAdminUser || (isCAF && isAdminPerfil)"
                class="submenu-item"
                to="/unidadesMedida"
                title="Unidades de Medida"
              >
                <span class="material-icons menu-icon">straighten</span>
                <span class="menu-text">Unidades de Medida</span>
              </router-link>

              <!-- Usuários: super admin, admin da CAF, admin de qualquer setor ou admin polo -->
              <router-link
                v-if="isAdminUser || isAdminPerfil || isAdminPolo"
                class="submenu-item"
                to="/users"
                title="Usuários"
              >
                <span class="material-icons menu-icon">group</span>
                <span class="menu-text">Usuários</span>
              </router-link>
            </div>
          </transition>
        </div>
      </template>

      <!-- Botão Relatórios: acessa modo relatórios -->
      <div v-if="isAdminPerfil || isAlmoxarifePerfil || isAdminUser" class="submenu-section">
        <button
          class="menu-item"
          @click="ativarModoRelatorios"
          title="Relatórios"
          :class="{ 'menu-item-relatorios-ativo': modoRelatorios }"
        >
          <span class="material-icons menu-icon">bar_chart</span>
          <span class="menu-text">Relatórios</span>
          <span class="material-icons" style="font-size: 16px; margin-left: auto;">arrow_forward_ios</span>
        </button>
      </div>
    </nav>
  </aside>

  <!-- Painel lateral de Relatórios (sobreposto quando ativo) -->
  <aside
    v-if="modoRelatorios"
    :class="`sidebar sidebar-relatorios ${is_expanded ? 'is-expanded' : ''}`"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Header do painel -->
    <div class="relatorios-header">
      <div class="relatorios-title">
        <span class="material-icons">bar_chart</span>
        <span class="menu-text">Relatórios</span>
      </div>
    </div>

    <nav class="menu-section">
      <router-link class="menu-item" to="/relatorios" title="Visão Geral">
        <span class="material-icons menu-icon">analytics</span>
        <span class="menu-text">Visão Geral</span>
      </router-link>

      <router-link class="menu-item" to="/relatorios/estoque" title="Estoque">
        <span class="material-icons menu-icon">inventory_2</span>
        <span class="menu-text">Estoque Atual</span>
      </router-link>

      <router-link class="menu-item" to="/relatorios/movimentacoes" title="Movimentações">
        <span class="material-icons menu-icon">swap_horiz</span>
        <span class="menu-text">Movimentações</span>
      </router-link>

      <router-link class="menu-item" to="/relatorios/entradas" title="Entradas por Notas Fiscais">
        <span class="material-icons menu-icon">receipt_long</span>
        <span class="menu-text">Entradas (NF)</span>
      </router-link>

      <router-link class="menu-item" to="/relatorios/entradas-por-data" title="Entradas por Data">
        <span class="material-icons menu-icon">event</span>
        <span class="menu-text">Entradas por Data</span>
      </router-link>

      <router-link class="menu-item" to="/relatorios/saidas" title="Saídas">
        <span class="material-icons menu-icon">exit_to_app</span>
        <span class="menu-text">Saídas Detalhadas</span>
      </router-link>

      <router-link class="menu-item" to="/relatorios/saidas-por-data" title="Saídas por Data">
        <span class="material-icons menu-icon">calendar_today</span>
        <span class="menu-text">Saídas por Data</span>
      </router-link>

      <router-link
        class="menu-item"
        to="/relatorios/medicamentos-controlados"
        title="Medicamentos Controlados"
      >
        <span class="material-icons menu-icon">medication</span>
        <span class="menu-text">Med. Controlados</span>
      </router-link>

      <!-- Relatório de Usuários: somente para admin -->
      <router-link
        v-if="isAdminPerfil || isAdminUser"
        class="menu-item"
        to="/relatorios/usuarios"
        title="Usuários"
      >
        <span class="material-icons menu-icon">group</span>
        <span class="menu-text">Usuários</span>
      </router-link>
    </nav>
    <div class="mt-auto p-3" style="margin-top: auto;">
      <button @click="desativarModoRelatorios" class="btn-voltar w-100" style="width: 100%; display: flex; justify-content: center; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.2); color: #fff; padding: 10px; border-radius: 8px; align-items: center; gap: 8px; margin-bottom: 10px;" title="Voltar ao sistema">
        <span class="material-icons">arrow_forward</span>
        <span class="menu-text">Voltar ao Sistema</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref, watch, onMounted, computed } from "vue";
import {
  HomeIcon,
  Building2Icon,
  PackageIcon,
  ArrowLeftRightIcon,
  DownloadIcon,
  ShoppingCartIcon,
  UsersIcon,
  StoreIcon,
  PlusCircleIcon,
  ChevronDownIcon,
  LayersIcon,
  BriefcaseIcon,
  MapIcon,
  BuildingIcon,
  TagIcon,
  RulerIcon,
  BarChart2Icon,
  LineChartIcon,
  ReceiptTextIcon,
  CalendarIcon,
  ArrowUpRightIcon,
  BoxesIcon
} from "lucide-vue-next";
import { useStore } from "vuex";
import { useRouter, useRoute } from "vue-router";
import axios from "axios";
import { API_URL } from "@/config";

// Importar logos para funcionar em produção
import logoHorizontal from "@/assets/logo-horizontal.png";
import logoIcon from "@/assets/logo-icon.png";

const store = useStore();
const router = useRouter();
const route = useRoute();

const is_expanded = ref(false);
const submenuOpen = ref(false);
const consumidoresSubmenuOpen = ref(false);
const relatoriosSubmenuOpen = ref(false);
const modoRelatorios = ref(false);
const setoresConsumidores = ref([]);
const solicitacoesPendentes = ref(0);

const emit = defineEmits(["toggle"]);

// Verificar se o usuário é super admin (exclusivo para governança global)
const isSuperAdmin = computed(() => {
  return Boolean(store.getters.isSuperAdmin);
});

// Verificar se o usuário é admin (super admin ou admin do setor)
const isAdminUser = computed(() => {
  const u = store.state.user;
  if (!u) return false;
  return Boolean(u.is_super_admin) || Boolean(u.is_admin);
});

// Verificar se o setor atual tem um setor fornecedor (não é raiz/fornecedor/distribuidor)
const hasSetorFornecedor = computed(() => {
  const setorDetails = store.state.setorDetails;
  return (
    setorDetails &&
    (setorDetails.setor_fornecedor ||
      setorDetails.setor_fornecedor_id ||
      (setorDetails.distribuidores_relacionados &&
        setorDetails.distribuidores_relacionados.length > 0))
  );
});

// Verificar se o setor atual possui controle de estoque ativado
const setorTemEstoque = computed(() => {
  const setorDetails = store.state.setorDetails;
  return setorDetails && !!setorDetails.estoque;
});

/**
 * Detecção de perfil: verifica o perfil do usuário no setor atual
 * via listUsuariosSetor (mesma lógica do router e do Home).
 */
const getPerfilAtual = () => {
  const user = store.state.user;
  if (!user) return '';
  const list = store.state.listUsuariosSetor || [];
  const found = list.find((u) => {
    const userId = u.usuario_id || u.user_id || u.id || (u.usuario && u.usuario.id);
    return userId === user.id;
  });
  return (
    (found && (found.perfil || (found.pivot && found.pivot.perfil))) ||
    (user.perfil) ||
    ''
  ).toString().toLowerCase();
};

/** Usuário possui perfil 'admin' no setor atual */
const isAdminPerfil = computed(() => getPerfilAtual() === 'admin');

/** Verifica se o usuário tem a flag de Admin Polo */
const isAdminPolo = computed(() => store.state.user?.is_admin_polo || false);

/** Usuário possui perfil 'almoxarife' no setor atual */
const isAlmoxarifePerfil = computed(() => {
  if (store.getters.isSuperAdmin) return false;
  const perfil = getPerfilAtual();
  return perfil === 'almoxarife' || perfil.includes('almoxarife');
});

// Verificar se o usuário possui perfil 'solicitante' no setor atual
const isSolicitante = computed(() => {
  if (store.getters.isSuperAdmin) return false;

  const user = store.state.user;
  if (!user) return false;

  try {
    // tentar usar a lista carregada no store (listUsuariosSetor)
    const list = store.state.listUsuariosSetor || [];
    const found = list.find((u) => {
      const userId =
        u.usuario_id || u.user_id || u.id || (u.usuario && u.usuario.id);
      const perfil = (u.perfil || (u.pivot && u.pivot.perfil) || "")
        .toString()
        .toLowerCase();
      return (
        userId === user.id &&
        (perfil === "solicitante" || perfil.includes("solicitante"))
      );
    });

    if (found) return true;
  } catch (e) {
    console.warn("Erro ao avaliar isSolicitante:", e);
  }

  // fallback: checar roles/perfil no objeto user
  if (
    (user.roles && user.roles.includes && user.roles.includes("solicitante")) ||
    (user.perfil &&
      user.perfil.toString().toLowerCase().includes("solicitante"))
  )
    return true;

  return false;
});

// Obter o nome do setor atual
const setorAtualNome = computed(() => {
  const setorDetails = store.state.setorDetails;
  return setorDetails?.nome_exibicao || setorDetails?.nome || "Setor Atual";
});

// Verifica se o setor atual é a CAF
const isCAF = computed(() => {
  const nome = setorAtualNome.value.toUpperCase();
  return nome.includes("CAF") || nome.includes("FARMÁCIA CENTRAL") || nome.includes("FARMACIA CENTRAL");
});

// Obter o nome da unidade do setor atual
const unidadeNome = computed(() => {
  const setorDetails = store.state.setorDetails;
  return setorDetails?.polo?.nome || "ProGest HGVC";
});

// Obter a imagem da unidade baseada no nome
const getUnidadeImage = (nomeUnidade) => {
  if (!nomeUnidade) return null;

  // Mapear nomes de unidades para arquivos de imagem
  const imageMap = {
    "Crescêncio Silveira": "Crescêncio Silveira.png",
    "Hospital Afrânio Peixoto": "Hospital Afrânio Peixoto.png",
    "Hospital Geral": "Hospital Geral.png",
    CHVC: "Logo-CHVC .png",
    UPA: "UPA.png",
  };

  // Tentar encontrar correspondência exata ou parcial
  for (const [key, value] of Object.entries(imageMap)) {
    if (nomeUnidade.includes(key) || key.includes(nomeUnidade)) {
      return `/src/assets/unidades/${value}`;
    }
  }

  return null;
};

// Computed para a logo atual
const currentLogoSrc = computed(() => {
  if (is_expanded.value) {
    // Quando expandida, mostrar logo horizontal
    return logoHorizontal;
  } else {
    // Quando recolhida, mostrar o ícone
    return logoIcon;
  }
});

// Carregar setores consumidores
const loadSetoresConsumidores = async () => {
  const setorDetails = store.state.setorDetails;
  if (!setorDetails || !setorDetails.id) return;

  try {
    const response = await axios.post(
      `/setores/listConsumers`,
      { id: setorDetails.id },
      {
        headers: {
          Authorization: `Bearer ${store.getters.getUserToken}`,
        },
      },
    );

    if (response.data.status && response.data.data) {
      setoresConsumidores.value = response.data.data;
    }
  } catch (error) {
    console.warn("Erro ao carregar setores consumidores:", error);
    setoresConsumidores.value = [];
  }
};

// Contador do badge de solicitações pendentes.
// A sidebar é global, então busca por conta própria em vez de depender do
// store, que só é preenchido enquanto a tela do setor está aberta.
const loadSolicitacoesPendentes = async () => {
  const setorDetails = store.state.setorDetails;
  if (!setorDetails || !setorDetails.id) {
    solicitacoesPendentes.value = 0;
    return;
  }

  try {
    const response = await axios.post(
      `/movimentacao/listByUnidade`,
      { setor_id: setorDetails.id },
      {
        headers: {
          Authorization: `Bearer ${store.getters.getUserToken}`,
        },
      },
    );

    const lista = (response.data && response.data.data) || [];
    solicitacoesPendentes.value = lista.filter(
      (m) => m.status_solicitacao === "P",
    ).length;
  } catch (error) {
    console.warn("Erro ao carregar solicitações pendentes:", error);
    solicitacoesPendentes.value = 0;
  }
};

// Navegar para outro setor (Visualização Read-Only)
const navigateToSetor = async (setorId) => {
  try {
    router.push(`/setores-consumidores/${setorId}`);
  } catch (error) {
    console.error("Erro ao navegar para setor consumidor:", error);
  }
};

const handleMouseEnter = () => {
  is_expanded.value = true;
};

const handleMouseLeave = () => {
  is_expanded.value = false;
};

const toggleSubmenu = () => {
  submenuOpen.value = !submenuOpen.value;
};

const toggleConsumidoresSubmenu = () => {
  consumidoresSubmenuOpen.value = !consumidoresSubmenuOpen.value;
};

const toggleRelatoriosSubmenu = () => {
  relatoriosSubmenuOpen.value = !relatoriosSubmenuOpen.value;
};

const ativarModoRelatorios = () => {
  modoRelatorios.value = true;
  router.push('/relatorios');
};

const desativarModoRelatorios = () => {
  modoRelatorios.value = false;
  router.push('/home');
};

onMounted(() => {
  const savedSubmenu = localStorage.getItem("submenuOpen");
  submenuOpen.value = savedSubmenu === "true";

  const savedConsumidoresSubmenu = localStorage.getItem(
    "consumidoresSubmenuOpen",
  );
  consumidoresSubmenuOpen.value = savedConsumidoresSubmenu === "true";

  const savedRelatoriosSubmenu = localStorage.getItem("relatoriosSubmenuOpen");
  relatoriosSubmenuOpen.value = savedRelatoriosSubmenu === "true";

  // Carregar setores consumidores
  loadSetoresConsumidores();
  loadSolicitacoesPendentes();
});

watch(submenuOpen, (val) => {
  localStorage.setItem("submenuOpen", val);
});

watch(consumidoresSubmenuOpen, (val) => {
  localStorage.setItem("consumidoresSubmenuOpen", val);
});

watch(relatoriosSubmenuOpen, (val) => {
  localStorage.setItem("relatoriosSubmenuOpen", val);
});

// Recarregar consumidores quando o setor atual mudar
watch(
  () => store.state.setorDetails,
  () => {
    loadSetoresConsumidores();
    loadSolicitacoesPendentes();
  },
  { deep: true },
);

// Manter o badge em dia quando a própria tela de movimentações recarrega a
// lista (aprovar/rejeitar/cancelar refletem aqui sem recarregar a página).
watch(
  () => store.state.listMovimentacoes,
  (lista) => {
    if (!Array.isArray(lista) || lista.length === 0) return;
    solicitacoesPendentes.value = lista.filter(
      (m) => m.status_solicitacao === "P",
    ).length;
  },
);

// Auto-ativar painel de relatórios ao navegar para /relatorios
watch(
  () => route.path,
  (path) => {
    if (path.startsWith('/relatorios')) {
      modoRelatorios.value = true;
    } else {
      modoRelatorios.value = false;
    }
  },
  { immediate: true },
);
</script>

<style lang="scss" scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  width: 80px;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a237e 0%, #0d47a1 100%);
  color: #ffffff;
  overflow: hidden;
  overflow-y: auto;
  padding: 1rem 0;
  transition: width 0.3s ease;
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.3);

  &.is-expanded {
    width: 280px;
  }

  /* Logo Section */
  .logo-section {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 70px;
    padding: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    margin-bottom: 0.5rem;
    cursor: pointer;

    &:hover .logo-image {
      opacity: 0.75;
    }

    .logo-image {
      max-width: 45px;
      height: auto;
      max-height: 50px;
      object-fit: contain;
      transition:
        max-width 0.3s ease,
        opacity 0.2s ease;
      filter: brightness(0) invert(1);
      margin: 0 auto;
    }
  }

  &.is-expanded {
    .logo-section {
      .logo-image {
        max-width: 200px;
        max-height: 55px;
      }
    }
  }

  /* Toggle Section */
  .toggle-section {
    display: none;
  }

  /* Menu Section */
  .menu-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0 0.5rem;

    .menu-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.6);
      padding: 0.5rem 1rem;

      opacity: 1;
      transition: opacity 0.3s ease;
      white-space: nowrap;
      text-align: left;
    }
  }

  /* Menu Divider */
  .menu-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.2);
    margin: 0.5rem 1rem;
  }

  /* Menu Items */
  .menu-item {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 0.8rem;
    height: 45px;
    padding: 0 1rem;
    border-radius: 8px;
    text-decoration: none;
    color: rgba(255, 255, 255, 0.9);
    transition: all 0.3s ease;
    font-size: 0.95rem;
    white-space: nowrap;
    cursor: pointer;
    background: transparent;
    border: none;

    .menu-icon {
      font-size: 1.3rem;
      min-width: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: rgba(255, 255, 255, 0.9);
    }

    .menu-text {
      opacity: 0;
      transition: opacity 0.3s ease;
      text-align: left;
      flex: 1;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
      transform: translateX(2px);
    }

    &.router-link-active,
    &.router-link-exact-active {
      background: rgba(255, 255, 255, 0.25);
      color: #ffffff;
      border-left: 3px solid #64b5f6;
      padding-left: calc(1rem - 3px);
      font-weight: 500;
    }

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }

    .badge-soon {
      font-size: 0.65rem;
      background: rgba(255, 193, 7, 0.3);
      color: #ffc107;
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: auto;
      white-space: nowrap;
    }

    /* Envolve o ícone para ancorar o contador; assim o badge continua
       visível também com a sidebar recolhida, onde o texto some. */
    .menu-icon-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .badge-pendentes {
      position: absolute;
      top: -5px;
      right: -7px;
      min-width: 17px;
      height: 17px;
      padding: 0 4px;
      border-radius: 999px;
      background: #ef4444;
      color: #ffffff;
      font-size: 0.62rem;
      font-weight: 700;
      line-height: 17px;
      text-align: center;
      box-shadow: 0 0 0 2px rgba(13, 71, 161, 0.6);
    }
  }

  &.is-expanded {
    .menu-item {
      .menu-text {
        opacity: 1;
      }
    }
    .submenu-items .submenu-item {
      padding-left: 2rem;
    }
  }

  /* Submenu Section */
  .submenu-section {
    display: flex;
    flex-direction: column;
    gap: 0;

    .submenu-toggle {
      position: relative;

      .expand-icon {
        font-size: 1.1rem;
        margin-left: auto;
        transition: transform 0.3s ease;
        color: rgba(255, 255, 255, 0.9);

        &.open {
          transform: rotate(180deg);
        }
      }
    }

    .submenu-items {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0.25rem 0;
      margin-left: 0;

      .submenu-item {
        @extend .menu-item;
        height: 40px;
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.8);
        cursor: pointer;
        justify-content: flex-start;
        padding: 0 1rem;

        .menu-icon {
          font-size: 0.9rem !important;
          min-width: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        &:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
        }

        &.router-link-active,
        &.router-link-exact-active {
          background: rgba(255, 255, 255, 0.2);
          border-left-color: #64b5f6;
        }
      }
    }
  }

  /* Animations */
  @media (max-width: 768px) {
    position: fixed;
    z-index: 99;
    height: 100vh;
  }
}

.submenu-transition-enter-active,
.submenu-transition-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.submenu-transition-enter-from,
.submenu-transition-leave-to {
  max-height: 0;
  opacity: 0;
}

.submenu-transition-enter-to,
.submenu-transition-leave-from {
  max-height: 200px;
  opacity: 1;
}

/* ======== Painel de Relatórios (modo roxo) ======== */
.sidebar-relatorios {
  /* Mudado para não ser fixed, para não sobrepor o conteúdo e empurrá-lo */
  order: 99;
  z-index: 10;
  background: linear-gradient(135deg, #1a237e 0%, #7b1fa2 60%, #9c27b0 100%);
  box-shadow: -2px 0 12px rgba(0, 0, 0, 0.3);

  .relatorios-header {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    margin-bottom: 0.5rem;
  }

  .btn-voltar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255,255,255,0.12);
    border: 1px solid rgba(255,255,255,0.2);
    color: #fff;
    border-radius: 8px;
    padding: 0.4rem 0.75rem;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 600;
    transition: all 0.2s ease;
    width: 100%;
    white-space: nowrap;
    overflow: hidden;

    &:hover {
      background: rgba(255,255,255,0.22);
    }

    .material-icons {
      font-size: 18px;
      flex-shrink: 0;
    }

    .menu-text {
      opacity: 0;
      width: 0;
      transition: opacity 0.3s ease, width 0.3s ease;
    }
  }

  &.is-expanded .btn-voltar .menu-text {
    opacity: 1;
    width: auto;
  }

  .relatorios-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.5rem;
    color: rgba(255,255,255,0.9);
    font-weight: 700;
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;

    .material-icons {
      font-size: 18px;
      flex-shrink: 0;
    }

    .menu-text {
      opacity: 0;
      width: 0;
      transition: opacity 0.3s ease, width 0.3s ease;
    }
  }

  &.is-expanded .relatorios-title .menu-text {
    opacity: 1;
    width: auto;
  }

  .menu-item {
    &.router-link-active,
    &.router-link-exact-active {
      background: rgba(255, 255, 255, 0.2);
      border-left: 3px solid rgba(255, 255, 255, 0.9);
    }

    &:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  }
}

.menu-item-relatorios-ativo {
  background: rgba(156, 39, 176, 0.2) !important;
  border-left: 3px solid #9c27b0 !important;
}
</style>
