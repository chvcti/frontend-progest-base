<script setup>
import { ref, computed, inject, watch } from "vue";
import { useStore } from "vuex";
import { useRoute, useRouter } from "vue-router";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeftRightIcon,
  PlusIcon,
  EyeIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  ClockIcon,
  CalendarIcon,
  UserIcon,
  FileTextIcon,
  AlertCircleIcon,
  TruckIcon,
  PencilIcon,
  SendIcon,
  Trash2Icon,
  SearchIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PrinterIcon,
  FileSpreadsheetIcon,
  ChevronRightIcon,
  RotateCcwIcon,
  ArrowRightIcon,
} from "lucide-vue-next";
import ModalNovaMovimentacao from "@/components/cadastros/ModalNovaMovimentacao.vue";
import ModalDevolucaoPedido from "@/components/roleSolicitante/ModalDevolucaoPedido.vue";
import { useToast } from "@/components/ui/toast/use-toast";
import { imprimirPedido } from "@/utils/imprimirPedido";
import {
  exportarPedidoExcel,
  exportarPedidosExcel,
} from "@/utils/exportarPedidoExcel";

const props = defineProps({
  setorId: { type: Number, required: true },
});

const store = useStore();
const route = useRoute();
const router = useRouter();
const { toast } = useToast();

// Nome do setor atual (para exibir no modal de aprovação)
const setorNome = computed(() => store.state.setorDetails?.nome || "Setor Atual");

const isCAF = computed(() => {
  const nome = setorNome.value?.toUpperCase() || "";
  return nome.includes("CAF") || nome.includes("FARMÁCIA CENTRAL") || nome.includes("FARMACIA CENTRAL");
});

const parentData = inject("setorAtualData", {
  movimentacoesItems: [],
});

const dialogMovimentacaoOpen = ref(false);
const modoInicialMovimentacao = ref("T");
const movimentacaoParaDevolver = ref(null);

const abrirModalRequisicao = () => {
  movimentacaoParaDevolver.value = null;
  modoInicialMovimentacao.value = "T";
  dialogMovimentacaoOpen.value = true;
};
const dialogDetalhesOpen = ref(false);
const dialogAprovacaoOpen = ref(false);
const movimentacaoSelecionada = ref(null);
const movimentacaoParaAprovar = ref(null);
const itensParaAprovacao = ref([]);
const loadingAprovacao = ref(false);
const dialogCancelamentoOpen = ref(false);
const movimentacaoParaCancelar = ref(null);
const loadingCancelamento = ref(false);
const previewLotesData = ref([]);

// Estado para gestão de rascunhos
const rascunhoParaEditar = ref(null);
const dialogEditarRascunhoOpen = ref(false);
const dialogEnviarRascunhoOpen = ref(false);
const rascunhoParaEnviar = ref(null);
const loadingEnvioRascunho = ref(false);
const dialogExcluirRascunhoOpen = ref(false);
const rascunhoParaExcluir = ref(null);
const loadingExcluirRascunho = ref(false);

const isSetorAdmin = computed(() => {
  const user = store.state.user;
  if (!user) return false;
  // Super Admin tem passe livre
  if (user.email?.toLowerCase() === "admin@admin.com" || user.email?.toLowerCase() === "adminti@gmail.com" || user.is_super_admin) return false;
  
  const list = parentData.usuariosItems?.value || parentData.usuariosItems || [];
  const found = list.find((u) => {
    const userId = u.usuario_id || u.user_id || u.id || u.usuario?.id;
    return userId === user.id;
  });
  if (!found) return false;
  
  const perfil = (found.perfil || found.pivot?.perfil || "").toString().toLowerCase();
  return perfil.includes("admin") || perfil.includes("gerente");
});

// Tipo e status vivem na URL para que atalhos do menu (ex.: "Solicitações
// Pendentes" â†’ ?tab=movimentacoes&status=P) já cheguem filtrados, e para que
// a tela filtrada continue compartilhável.
const STATUS_VALIDOS = ["P", "A", "R", "C", "X"];
const TIPOS_VALIDOS = ["entrada", "saida"];

const statusDaRota = () =>
  STATUS_VALIDOS.includes(route.query.status) ? route.query.status : "todos";
const tipoDaRota = () =>
  TIPOS_VALIDOS.includes(route.query.tipo) ? route.query.tipo : "todos";

const filterTipo = ref(tipoDaRota());
const filterStatus = ref(statusDaRota());
const filterSolicitante = ref("todos");
const filterSearch = ref("");

// URL â†’ filtros
watch(
  () => [route.query.status, route.query.tipo],
  () => {
    filterStatus.value = statusDaRota();
    filterTipo.value = tipoDaRota();
  },
);

// Filtros â†’ URL. Sem isso, mudar o filtro na mão e clicar de novo no item do
// menu não voltaria a filtrar (a query já estaria igual e o watch acima não
// dispararia).
watch([filterStatus, filterTipo], ([status, tipo]) => {
  const query = { ...route.query };

  if (status && status !== "todos") query.status = status;
  else delete query.status;

  if (tipo && tipo !== "todos") query.tipo = tipo;
  else delete query.tipo;

  if (
    query.status === route.query.status &&
    query.tipo === route.query.tipo
  ) {
    return; // nada mudou: evita navegação redundante
  }

  router.replace({ query });
});
const sortBy = ref("created_at");
const sortDir = ref("desc");

// Linhas expandidas na tabela (mesmo padrão dos relatórios): clicar na
// requisição abre os itens logo abaixo dela.
const expandedRows = ref({});

const toggleRow = (id) => {
  expandedRows.value[id] = !expandedRows.value[id];
};

const handleSort = (col) => {
  if (sortBy.value === col) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
  } else {
    sortBy.value = col;
    sortDir.value = "asc";
  }
};

const listMovimentacoes = computed(
  () =>
    parentData.movimentacoesItems?.value || parentData.movimentacoesItems || [],
);

const listSolicitantes = computed(() => {
  const set = new Set();
  listMovimentacoes.value.forEach(mov => {
    const nome = mov.usuario?.name || 'Sistema';
    set.add(nome);
  });
  return Array.from(set).sort();
});

const filteredMovimentacoes = computed(() => {
  let items = [...listMovimentacoes.value];
  if (filterTipo.value !== "todos") {
    items = items.filter((mov) =>
      filterTipo.value === "entrada" ? isEntrada(mov) : isSaida(mov),
    );
  }
  if (filterStatus.value !== "todos") {
    items = items.filter(
      (mov) => mov.status_solicitacao === filterStatus.value,
    );
  }
  if (filterSolicitante.value !== "todos") {
    items = items.filter((mov) => {
      const nome = mov.usuario?.name || 'Sistema';
      return nome === filterSolicitante.value;
    });
  }
  if (filterSearch.value.trim()) {
    const term = filterSearch.value.toLowerCase();
    items = items.filter((mov) => {
      const orig = (
        mov.setor_origem?.nome_exibicao || mov.setor_origem?.nome ||
        mov.setorOrigem?.nome_exibicao || mov.setorOrigem?.nome ||
        ""
      ).toLowerCase();
      const dest = (
        mov.setor_destino?.nome_exibicao || mov.setor_destino?.nome ||
        mov.setorDestino?.nome_exibicao || mov.setorDestino?.nome ||
        ""
      ).toLowerCase();
      const usr = (mov.usuario?.name || "").toLowerCase();
      return orig.includes(term) || dest.includes(term) || usr.includes(term);
    });
  }
  return items.sort((a, b) => {
    let valA = null;
    let valB = null;

    if (sortBy.value === 'created_at') {
      valA = new Date(a.created_at).getTime();
      valB = new Date(b.created_at).getTime();
    } else if (sortBy.value === 'status') {
      valA = (a.status_solicitacao || "").toLowerCase();
      valB = (b.status_solicitacao || "").toLowerCase();
    }

    if (valA < valB) return sortDir.value === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir.value === 'asc' ? 1 : -1;
    return 0;
  });
});

const isEntrada = (mov) => {
  const sid = Number(props.setorId);
  return Number(mov.setor_destino_id) === sid || Number(mov.setorDestino?.id) === sid;
};
const isSaida = (mov) => {
  const sid = Number(props.setorId);
  return Number(mov.setor_origem_id) === sid || Number(mov.setorOrigem?.id) === sid;
};

// Em devolução (tipo 'D'), o setor de destino (quem recebe a mercadoria de volta) é quem aprova;
// Em transferência comum, quem aprova é o setor de origem (quem fornece o item).
const podeAprovarMov = (mov) => {
  if (mov.status_solicitacao !== "P") return false;
  if (mov.tipo === "D") {
    return isEntrada(mov);
  }
  return isSaida(mov);
};

// Em devolução, quem pode cancelar antes da aprovação é quem solicitou a devolução (origem);
// Em transferência comum, quem pode cancelar é quem fez o pedido (destino).
const podeCancelarMov = (mov) => {
  if (mov.status_solicitacao !== "P") return false;
  if (mov.tipo === "D") {
    return isSaida(mov);
  }
  return isEntrada(mov);
};

// Verifica se o rascunho pertence ao setor atual para permitir edição/envio
const podeEditarRascunho = (mov) => {
  if (mov.status_solicitacao !== "C") return false;
  if (mov.tipo === "D") {
    return isSaida(mov);
  }
  return isEntrada(mov);
};

// Verifica se a movimentação é elegível para devolução direta
const podeDevolverMovimentacao = (mov) => {
  if (mov.status_solicitacao !== "A") return false;
  if (mov.tipo === "D") return false; // Não devolver algo que já foi devolução
  // O setor atual deve ter recebido os itens (entrada) para poder devolvê-los
  return isEntrada(mov);
};

const countTodas = computed(() => listMovimentacoes.value.length);
const countSaidas = computed(() => listMovimentacoes.value.filter(isSaida).length);
const countEntradas = computed(() => listMovimentacoes.value.filter(isEntrada).length);
const countPendentes = computed(() => listMovimentacoes.value.filter(m => m.status_solicitacao === "P").length);

const activeTab = computed(() => {
  if (filterStatus.value === "P") return "pendentes";
  if (filterTipo.value === "saida") return "saidas";
  if (filterTipo.value === "entrada") return "entradas";
  return "todas";
});

const selecionarAba = (aba) => {
  if (aba === "todas") {
    filterTipo.value = "todos";
    filterStatus.value = "todos";
  } else if (aba === "saidas") {
    filterTipo.value = "saida";
    filterStatus.value = "todos";
  } else if (aba === "entradas") {
    filterTipo.value = "entrada";
    filterStatus.value = "todos";
  } else if (aba === "pendentes") {
    filterTipo.value = "todos";
    filterStatus.value = "P";
  }
};

const pedidoParaDevolver = ref(null);

const abrirDevolucaoEntrada = (mov) => {
  pedidoParaDevolver.value = mov;
};

const onDevolucaoSucesso = () => {
  toast({
    title: "Sucesso",
    description: "Devolução registrada com sucesso.",
  });
  window.location.reload();
};

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

const formatarSetorComPolo = (setor) => {
  if (!setor) return "—";
  const nome = setor.nome_exibicao || setor.nome || "Setor";
  const siglaPolo = setor.polo?.sigla || setor.polo?.nome || null;
  return siglaPolo ? `${nome} (${siglaPolo})` : nome;
};

const getStatusBadge = (status) => {
  const map = {
    A: { label: "Aprovada", variant: "success" },
    R: { label: "Rejeitada", variant: "destructive" },
    P: { label: "Pendente", variant: "warning" },
    C: { label: "Rascunho", variant: "secondary" },
    X: { label: "Cancelada", variant: "outline" },
  };
  return map[status] || { label: status, variant: "default" };
};

const verDetalhes = (mov) => {
  movimentacaoSelecionada.value = mov;
  dialogDetalhesOpen.value = true;
};

// A listagem já traz itens.produto, usuario e os setores, então dá para
// imprimir direto da linha sem uma nova requisição.
const imprimir = (mov) => {
  if (!imprimirPedido(mov)) {
    toast({
      title: "Erro",
      description:
        "Não foi possível abrir a janela de impressão. Verifique se pop-ups estão bloqueados.",
      variant: "destructive",
    });
  }
};

// Exporta a requisicao da linha, com os mesmos dados da via impressa.
const exportarExcel = async (mov) => {
  if (!(await exportarPedidoExcel(mov))) {
    toast({
      title: "Erro",
      description: "Nao foi possivel gerar a planilha da requisicao.",
      variant: "destructive",
    });
  }
};

// Exporta a lista como esta na tela (filtros e ordenacao aplicados).
const exportarListaExcel = async () => {
  const gerou = await exportarPedidosExcel(filteredMovimentacoes.value, {
    nomeArquivo: "requisicoes_" + setorNome.value,
    titulo: "Requisicoes - " + setorNome.value,
  });

  if (!gerou) {
    toast({
      title: "Nada para exportar",
      description: "Nenhuma requisicao no filtro atual.",
    });
  }
};

// O backend recusa aprovacoes com motivo (lote vencido, saldo insuficiente,
// movimentacao ja processada). Sem isso o operador so veria um erro generico.
const motivoDoErro = (e, padrao) => {
  const data = e?.response?.data;
  if (Array.isArray(data?.erros) && data.erros.length) return data.erros.join(" ");
  return data?.message || padrao;
};

const abrirModalAprovacao = async (mov) => {
  movimentacaoParaAprovar.value = mov;
  previewLotesData.value = [];
  loadingAprovacao.value = true;
  try {
    const authHeader = { Authorization: "Bearer " + store.getters.getUserToken };
    const [estoqueResponse, previewResponse] = await Promise.allSettled([
      axios.get(`/estoque/setor/${props.setorId}`, { headers: authHeader }),
      axios.get(`/movimentacao/${mov.id}/preview-lotes`, { headers: authHeader }),
    ]);

    let estoqueMap = {};
    // A API retorna 'status' (não 'success') como flag de sucesso
    if (estoqueResponse.status === "fulfilled" && estoqueResponse.value.data.status && estoqueResponse.value.data.data?.estoque) {
      estoqueResponse.value.data.data.estoque.forEach((e) => {
        estoqueMap[e.produto?.id || e.produto_id] = e.quantidade_atual;
      });
    }

    if (previewResponse.status === "fulfilled" && previewResponse.value.data.status) {
      previewLotesData.value = previewResponse.value.data.data || [];
    }

    itensParaAprovacao.value = (mov.itens || []).map((item) => {
      let lotesConsumidos = [];
      try {
        if (item.lote) {
          lotesConsumidos = JSON.parse(item.lote);
        }
      } catch(e) { console.error("Erro ao fazer parse dos lotes:", e); }
      
      return {
        ...item,
        lotesConsumidos,
        quantidade_liberada: item.quantidade_liberada ?? item.quantidade_solicitada,
        estoque_atual: estoqueMap[item.produto?.id || item.produto_id] || 0,
      };
    });
    dialogAprovacaoOpen.value = true;
  } catch (e) {
    toast({
      title: "Erro",
      description: "Não foi possível carregar o estoque para validação.",
      variant: "destructive",
    });
  } finally {
    loadingAprovacao.value = false;
  }
};

const aprovarMovimentacao = async () => {
  loadingAprovacao.value = true;
  try {
    const payload = {
      status: "A",
      itens: itensParaAprovacao.value.map((it) => ({
        id: it.id,
        quantidade_liberada: it.quantidade_liberada,
      })),
    };
    await axios.post(
      `/movimentacao/${movimentacaoParaAprovar.value.id}/process`,
      payload,
      {
        headers: { Authorization: "Bearer " + store.getters.getUserToken },
      },
    );
    toast({
      title: "Sucesso",
      description: "Movimentação aprovada com sucesso.",
    });
    dialogAprovacaoOpen.value = false;
    location.reload(); // Simples reload para atualizar estado global
  } catch (e) {
    toast({
      title: "Erro",
      description: motivoDoErro(e, "Falha ao aprovar movimentação."),
      variant: "destructive",
    });
  } finally {
    loadingAprovacao.value = false;
  }
};

const rejeitarMovimentacao = async () => {
  loadingAprovacao.value = true;
  try {
    await axios.post(
      `/movimentacao/${movimentacaoParaAprovar.value.id}/process`,
      { status: "R" },
      {
        headers: { Authorization: "Bearer " + store.getters.getUserToken },
      },
    );
    toast({ title: "Sucesso", description: "Movimentação rejeitada." });
    dialogAprovacaoOpen.value = false;
    location.reload();
  } catch (e) {
    toast({
      title: "Erro",
      description: motivoDoErro(e, "Falha ao rejeitar."),
      variant: "destructive",
    });
  } finally {
    loadingAprovacao.value = false;
  }
};

const confirmarCancelamento = (mov) => {
  movimentacaoParaCancelar.value = mov;
  dialogCancelamentoOpen.value = true;
};

const cancelarMovimentacao = async () => {
  loadingCancelamento.value = true;
  try {
    await axios.post(
      `/movimentacao/${movimentacaoParaCancelar.value.id}/process`,
      { status: "X" },
      {
        headers: { Authorization: "Bearer " + store.getters.getUserToken },
      },
    );
    toast({ title: "Sucesso", description: "Solicitação cancelada." });
    dialogCancelamentoOpen.value = false;
    location.reload();
  } catch (e) {
    toast({
      title: "Erro",
      description: "Falha ao cancelar.",
      variant: "destructive",
    });
  } finally {
    loadingCancelamento.value = false;
  }
};

// Ações de rascunho
const abrirEditarRascunho = (mov) => {
  rascunhoParaEditar.value = mov;
  dialogEditarRascunhoOpen.value = true;
};

const confirmarEnvioRascunho = (mov) => {
  rascunhoParaEnviar.value = mov;
  dialogEnviarRascunhoOpen.value = true;
};

const enviarRascunho = async () => {
  loadingEnvioRascunho.value = true;
  try {
    await axios.post(
      `/movimentacao/${rascunhoParaEnviar.value.id}/process`,
      { status: "P" },
      { headers: { Authorization: "Bearer " + store.getters.getUserToken } },
    );
    toast({ title: "Enviado!", description: "Rascunho promovido para Pendente com sucesso." });
    dialogEnviarRascunhoOpen.value = false;
    location.reload();
  } catch (e) {
    toast({ title: "Erro", description: "Falha ao enviar rascunho.", variant: "destructive" });
  } finally {
    loadingEnvioRascunho.value = false;
  }
};

const confirmarExclusaoRascunho = (mov) => {
  rascunhoParaExcluir.value = mov;
  dialogExcluirRascunhoOpen.value = true;
};

const excluirRascunho = async () => {
  loadingExcluirRascunho.value = true;
  try {
    await axios.post(
      `/movimentacao/${rascunhoParaExcluir.value.id}/delete`,
      {},
      { headers: { Authorization: "Bearer " + store.getters.getUserToken } },
    );
    toast({ title: "Excluído", description: "Rascunho excluído com sucesso." });
    dialogExcluirRascunhoOpen.value = false;
    location.reload();
  } catch (e) {
    toast({ title: "Erro", description: "Falha ao excluir rascunho.", variant: "destructive" });
  } finally {
    loadingExcluirRascunho.value = false;
  }
};

/**
 * Soma as devoluções registradas para um item específico de uma movimentação.
 * Usa o array `devolucoes` já carregado pelo backend (via eager load).
 */
const calcularQtdDevolvida = (mov, itemId) => {
  if (!mov.devolucoes || mov.devolucoes.length === 0) return 0;
  let total = 0;
  for (const d of mov.devolucoes) {
    if (d.item_movimentacao_id === itemId) {
      total += Number(d.quantidade);
    }
  }
  return total;
};
</script>

<template>
  <div class="flex flex-col gap-4 pb-10">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-end gap-3">
      <Button
        v-if="!isCAF"
        @click="abrirModalRequisicao"
        class="gap-2 shadow-lg shadow-primary/20"
      >
        <PlusIcon class="w-4 h-4" /> Nova Requisição
      </Button>
    </div>

    <!-- Tabs de Navegação de Movimentações -->
    <div class="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
      <button
        type="button"
        @click="selecionarAba('todas')"
        class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
        :class="activeTab === 'todas' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'"
      >
        <ArrowLeftRightIcon class="w-4 h-4" />
        Todas as Movimentações
        <Badge :class="activeTab === 'todas' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'" class="ml-1 text-xs">
          {{ countTodas }}
        </Badge>
      </button>

      <button
        type="button"
        @click="selecionarAba('saidas')"
        class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
        :class="activeTab === 'saidas' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'"
      >
        <ArrowUpCircleIcon class="w-4 h-4" />
        Saídas
        <Badge :class="activeTab === 'saidas' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'" class="ml-1 text-xs">
          {{ countSaidas }}
        </Badge>
      </button>

      <button
        type="button"
        @click="selecionarAba('entradas')"
        class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
        :class="activeTab === 'entradas' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'"
      >
        <ArrowDownCircleIcon class="w-4 h-4" />
        Entradas
        <Badge :class="activeTab === 'entradas' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'" class="ml-1 text-xs">
          {{ countEntradas }}
        </Badge>
      </button>

      <button
        type="button"
        @click="selecionarAba('pendentes')"
        class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
        :class="activeTab === 'pendentes' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'"
      >
        <ClockIcon class="w-4 h-4" />
        Movimentações Pendentes
        <Badge v-if="countPendentes > 0" :class="activeTab === 'pendentes' ? 'bg-white text-amber-600' : 'bg-amber-100 text-amber-800'" class="ml-1 text-xs font-black">
          {{ countPendentes }}
        </Badge>
      </button>
    </div>

    <!-- Filters -->
    <Card class="border-slate-200 shadow-sm bg-slate-50/50">
      <CardContent class="p-4 flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <Label class="text-[10px] font-bold uppercase text-slate-400"
            >Tipo</Label
          >
          <Select v-model="filterTipo">
            <SelectTrigger class="w-[120px] h-9 bg-white"
              ><SelectValue
            /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="entrada">Entradas</SelectItem>
              <SelectItem value="saida">Saídas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="flex items-center gap-2">
          <Label class="text-[10px] font-bold uppercase text-slate-400"
            >Status</Label
          >
          <Select v-model="filterStatus">
            <SelectTrigger class="w-[140px] h-9 bg-white"
              ><SelectValue
            /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="P">Pendente</SelectItem>
              <SelectItem value="A">Aprovada</SelectItem>
              <SelectItem value="R">Rejeitada</SelectItem>
              <SelectItem value="C">Rascunho</SelectItem>
              <SelectItem value="X">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>



        <div class="flex items-center gap-2">
          <Label class="text-[10px] font-bold uppercase text-slate-400">Solicitante</Label>
          <Select v-model="filterSolicitante">
            <SelectTrigger class="w-[140px] h-9 bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem v-for="solic in listSolicitantes" :key="solic" :value="solic">{{ solic }}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="flex-1 min-w-[200px] relative">
          <SearchIcon class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            v-model="filterSearch"
            placeholder="Buscar requisição..."
            class="!pl-10 pr-4 h-9 bg-white"
          />
        </div>

        <!-- Exporta a lista conforme os filtros acima -->
        <Button
          variant="outline"
          size="sm"
          class="h-9 gap-2 bg-white font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
          :disabled="filteredMovimentacoes.length === 0"
          @click="exportarListaExcel"
        >
          <FileSpreadsheetIcon class="w-4 h-4" />
          Exportar Excel
        </Button>
      </CardContent>
    </Card>

    <!-- Table -->
    <Card
      v-if="filteredMovimentacoes.length > 0"
      class="border-slate-200 shadow-sm overflow-hidden"
    >
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-slate-50 border-b">
            <tr>
              <th class="py-4 px-4 text-center font-bold text-slate-500 uppercase text-[10px]">ID Pedido</th>
              <th class="py-4 px-6 text-left font-bold text-slate-500 uppercase text-[10px]">Fluxo</th>
              <th
                @click="handleSort('created_at')"
                class="py-4 px-6 text-left font-bold text-slate-500 uppercase text-[10px] cursor-pointer hover:bg-slate-100 transition-colors select-none"
              >
                <div class="flex items-center gap-1">
                  Data/Hora
                  <ArrowUpDownIcon v-if="sortBy !== 'created_at'" class="w-3 h-3 opacity-50" />
                  <ArrowUpIcon v-else-if="sortDir === 'asc'" class="w-3 h-3 text-primary" />
                  <ArrowDownIcon v-else class="w-3 h-3 text-primary" />
                </div>
              </th>
              <th class="py-4 px-6 text-left font-bold text-slate-500 uppercase text-[10px]">Origem</th>
              <th class="py-4 px-6 text-left font-bold text-slate-500 uppercase text-[10px]">Destino</th>
              <th class="py-4 px-6 text-left font-bold text-slate-500 uppercase text-[10px]">Solicitante</th>
              <th class="py-4 px-6 text-center font-bold text-slate-500 uppercase text-[10px]">Itens</th>
              <th
                @click="handleSort('status')"
                class="py-4 px-6 text-center font-bold text-slate-500 uppercase text-[10px] cursor-pointer hover:bg-slate-100 transition-colors select-none"
              >
                <div class="flex items-center justify-center gap-1">
                  Status
                  <ArrowUpDownIcon v-if="sortBy !== 'status'" class="w-3 h-3 opacity-50" />
                  <ArrowUpIcon v-else-if="sortDir === 'asc'" class="w-3 h-3 text-primary" />
                  <ArrowDownIcon v-else class="w-3 h-3 text-primary" />
                </div>
              </th>
              <th class="py-4 px-6 text-left font-bold text-slate-500 uppercase text-[10px]">Aprovador</th>
              <th class="py-4 px-6 text-right font-bold text-slate-500 uppercase text-[10px]">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <template v-for="mov in filteredMovimentacoes" :key="mov.id">
            <tr
              @click="toggleRow(mov.id)"
              :class="[
                'transition-all duration-300 group border-b border-slate-100 cursor-pointer',
                mov.status_solicitacao === 'A' ? 'bg-gradient-to-r from-emerald-500/10 to-transparent hover:from-emerald-500/20' :
                mov.status_solicitacao === 'R' ? 'bg-gradient-to-r from-red-500/10 to-transparent hover:from-red-500/20' :
                mov.status_solicitacao === 'P' ? 'bg-gradient-to-r from-amber-500/15 to-transparent hover:from-amber-500/25' :
                mov.status_solicitacao === 'X' ? 'bg-gradient-to-r from-slate-500/10 to-transparent hover:from-slate-500/20 opacity-90' :
                mov.status_solicitacao === 'C' ? 'bg-gradient-to-r from-blue-500/10 to-transparent hover:from-blue-500/20' :
                'hover:bg-slate-50'
              ]"
            >
              <!-- Coluna ID Pedido Destacada -->
              <td class="py-4 px-4 text-center">
                <span class="inline-flex items-center px-2 py-0.5 rounded font-mono text-xs font-black bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs">
                  #{{ mov.numero_pedido || mov.id }}
                </span>
              </td>
              <td :class="[
                'py-4 px-6 border-l-[6px]',
                mov.status_solicitacao === 'A' ? 'border-l-emerald-500' :
                mov.status_solicitacao === 'R' ? 'border-l-red-500' :
                mov.status_solicitacao === 'P' ? 'border-l-amber-500' :
                mov.status_solicitacao === 'X' ? 'border-l-slate-400' :
                mov.status_solicitacao === 'C' ? 'border-l-blue-500' :
                'border-l-transparent'
              ]">
                <div class="flex items-center gap-2">
                  <ChevronRightIcon
                    class="w-4 h-4 shrink-0 text-slate-400 transition-transform duration-200"
                    :class="{ 'rotate-90 text-primary': expandedRows[mov.id] }"
                  />
                  <!-- Nomenclatura Padrão Hospitalar: Devolução ao Distribuidor 📤 / Devolução Recebida 📥 -->
                  <div
                    v-if="mov.tipo === 'D'"
                    class="flex items-center gap-1.5 flex-wrap"
                  >
                    <!-- Devolução Recebida (quando o setor atual recebe de volta) -->
                    <span
                      v-if="isEntrada(mov)"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs"
                    >
                      <span class="text-sm leading-none">📥</span>
                      <span>Devolução Recebida</span>
                    </span>

                    <!-- Devolução ao Distribuidor (quando o setor atual devolve) -->
                    <span
                      v-else
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs"
                    >
                      <span class="text-sm leading-none">📤</span>
                      <span>Devolução ao Distribuidor</span>
                    </span>

                    <!-- Badge destacada de referência ao pedido -->
                    <span
                      v-if="mov.pedido_origem_id || (mov.numero_pedido && mov.numero_pedido !== mov.id)"
                      class="inline-flex items-center text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold border border-slate-200"
                    >
                      Ref. Pedido #{{ mov.pedido_origem_id || mov.numero_pedido }}
                    </span>
                  </div>
                  <div
                    v-else-if="mov.tipo === 'C'"
                    class="flex items-center gap-1.5 text-purple-600 font-bold"
                  >
                    <span class="text-[11px] uppercase">Consumo</span>
                  </div>
                  <div
                    v-else-if="isEntrada(mov)"
                    class="flex items-center gap-2 text-emerald-600 font-bold"
                  >
                    <ArrowDownCircleIcon class="w-5 h-5" />
                    <span class="text-[11px] uppercase">Entrada</span>
                    <Badge v-if="mov.tem_devolucao" class="text-[9px] h-4 px-1 bg-amber-100 text-amber-800 border-amber-300 font-semibold">Devolvido</Badge>
                  </div>
                  <div
                    v-else
                    class="flex items-center gap-2 text-blue-600 font-bold"
                  >
                    <ArrowUpCircleIcon class="w-5 h-5" />
                    <span class="text-[11px] uppercase">Saída</span>
                    <Badge v-if="mov.tem_devolucao" class="text-[9px] h-4 px-1 bg-amber-100 text-amber-800 border-amber-300 font-semibold">Devolvido</Badge>
                  </div>
                </div>
              </td>
              <td class="py-4 px-6">
                <div class="flex flex-col">
                  <span class="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{{
                    formatarData(mov.created_at)
                  }}</span>
                  <span
                    class="text-[11px] text-slate-400 flex items-center gap-1"
                    ><ClockIcon class="w-3 h-3" />
                    {{ formatarHora(mov.created_at) }}</span
                  >
                </div>
              </td>
              <td
                class="py-4 px-6 font-medium transition-colors"
                :class="
                  isSaida(mov)
                    ? 'text-slate-900 font-semibold'
                    : 'text-slate-500'
                "
              >
                {{ mov.setor_origem?.nome_exibicao || mov.setor_origem?.nome || mov.setorOrigem?.nome_exibicao || mov.setorOrigem?.nome || "-" }}
              </td>
              <td
                class="py-4 px-6 font-medium transition-colors"
                :class="
                  isEntrada(mov)
                    ? 'text-slate-900 font-semibold'
                    : 'text-slate-500'
                "
              >
                {{ mov.setor_destino?.nome_exibicao || mov.setor_destino?.nome || mov.setorDestino?.nome_exibicao || mov.setorDestino?.nome || "-" }}
              </td>
              <td class="py-4 px-6">
                <div class="flex items-center gap-1.5">
                  <UserIcon class="w-3.5 h-3.5 text-slate-400 group-hover:text-primary transition-colors" />
                  <span class="text-[11px] font-bold text-slate-600 capitalize">{{ mov.usuario?.name || 'Sistema' }}</span>
                </div>
              </td>
              <td class="py-4 px-6 text-center">
                <Badge variant="outline" class="font-black bg-white shadow-sm">{{
                  mov.itens?.length || 0
                }}</Badge>
              </td>
              <td class="py-4 px-6 text-center">
                <Badge
                  variant="outline"
                  :class="[
                    'text-[10px] font-black uppercase tracking-widest shadow-sm border text-white',
                    mov.status_solicitacao === 'A' ? 'bg-emerald-500 border-emerald-600' :
                    mov.status_solicitacao === 'R' ? 'bg-red-500 border-red-600' :
                    mov.status_solicitacao === 'P' ? 'bg-amber-500 border-amber-600' :
                    mov.status_solicitacao === 'X' ? 'bg-slate-500 border-slate-600' :
                    mov.status_solicitacao === 'C' ? 'bg-blue-500 border-blue-600' :
                    'bg-slate-100 text-slate-900 border-slate-200'
                  ]"
                >
                  {{ getStatusBadge(mov.status_solicitacao).label }}
                </Badge>
              </td>
              <!-- Aprovador / responsável pela resposta -->
              <td class="py-4 px-6">
                <div v-if="mov.aprovador" class="flex items-center gap-1.5">
                  <CheckCircle2Icon v-if="mov.status_solicitacao === 'A'" class="w-3.5 h-3.5 text-emerald-500" />
                  <XCircleIcon v-else-if="mov.status_solicitacao === 'R'" class="w-3.5 h-3.5 text-red-400" />
                  <span class="text-[11px] font-bold text-slate-600">{{ mov.aprovador?.name }}</span>
                </div>
                <span v-else class="text-slate-300 text-xs">—</span>
              </td>

                <!-- Ver detalhes (sempre visível) -->
                <td class="py-4 px-6 text-right space-x-1" @click.stop>
                <Button
                  variant="ghost"
                  size="icon"
                  @click="verDetalhes(mov)"
                  class="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                  title="Ver detalhes"
                >
                  <EyeIcon class="w-4 h-4" />
                </Button>

                <!-- Imprimir requisição (sempre visível) -->
                <Button
                  variant="ghost"
                  size="icon"
                  @click="imprimir(mov)"
                  class="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                  title="Imprimir requisição"
                >
                  <PrinterIcon class="w-4 h-4" />
                </Button>

                <!-- Exportar requisição em Excel (sempre visível) -->
                <Button
                  variant="ghost"
                  size="icon"
                  @click="exportarExcel(mov)"
                  class="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                  title="Exportar requisição em Excel"
                >
                  <FileSpreadsheetIcon class="w-4 h-4" />
                </Button>


                <!-- Aprovar (Pendente) -->
                <Button
                  v-if="podeAprovarMov(mov)"
                  variant="ghost"
                  size="icon"
                  @click="abrirModalAprovacao(mov)"
                  class="h-8 w-8 text-emerald-600 hover:bg-emerald-100 transition-colors"
                  :title="mov.tipo === 'D' ? 'Aprovar recebimento de devolução' : 'Aprovar movimentação'"
                >
                  <CheckCircle2Icon class="w-4 h-4" />
                </Button>

                <!-- Cancelar solicitação (Pendente) -->
                <Button
                  v-if="podeCancelarMov(mov)"
                  variant="ghost"
                  size="icon"
                  @click="confirmarCancelamento(mov)"
                  class="h-8 w-8 text-destructive hover:bg-destructive/10 transition-colors"
                  :title="mov.tipo === 'D' ? 'Cancelar devolução' : 'Cancelar solicitação'"
                >
                  <XCircleIcon class="w-4 h-4" />
                </Button>

                <!-- Devolver Pedido (entrada Aprovada) -->
                <Button
                  v-if="isEntrada(mov) && mov.status_solicitacao === 'A' && mov.tipo !== 'D'"
                  variant="ghost"
                  size="icon"
                  @click="abrirDevolucaoEntrada(mov)"
                  class="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                  title="Realizar devolução deste pedido"
                >
                  <RotateCcwIcon class="w-4 h-4" />
                </Button>

                <!-- Ações de Rascunho -->
                <template v-if="podeEditarRascunho(mov)">
                  <!-- Editar rascunho -->
                  <Button
                    variant="ghost"
                    size="icon"
                    @click="abrirEditarRascunho(mov)"
                    class="h-8 w-8 text-amber-500 hover:bg-amber-100 transition-colors"
                    title="Editar rascunho"
                  >
                    <PencilIcon class="w-4 h-4" />
                  </Button>
                  <!-- Enviar (promover para Pendente) -->
                  <Button
                    variant="ghost"
                    size="icon"
                    @click="confirmarEnvioRascunho(mov)"
                    class="h-8 w-8 text-emerald-600 hover:bg-emerald-100 transition-colors"
                    title="Enviar solicitação"
                  >
                    <SendIcon class="w-4 h-4" />
                  </Button>
                  <!-- Excluir rascunho -->
                  <Button
                    variant="ghost"
                    size="icon"
                    @click="confirmarExclusaoRascunho(mov)"
                    class="h-8 w-8 text-destructive hover:bg-destructive/10 transition-colors"
                    title="Excluir rascunho"
                  >
                    <Trash2Icon class="w-4 h-4" />
                  </Button>
                </template>
              </td>
            </tr>

            <!-- Linha expansível: itens e quantidades da requisição -->
            <tr v-if="expandedRows[mov.id]" class="bg-slate-50/80">
              <td colspan="8" class="p-0">
                <div class="px-6 py-5 border-l-[6px] border-l-slate-200">
                  <div
                    v-if="mov.tipo === 'D' && (mov.numero_pedido || mov.pedido_origem_id)"
                    class="mb-3"
                  >
                    <Badge variant="outline" class="border-amber-400 bg-amber-50 text-amber-900 font-bold px-2.5 py-1 text-xs">
                      <RotateCcwIcon class="w-3.5 h-3.5 mr-1 inline text-amber-600" />
                      Devolução referente ao Pedido #{{ mov.numero_pedido || mov.pedido_origem_id }}
                    </Badge>
                  </div>

                  <div
                    v-if="mov.observacao"
                    class="mb-4 text-xs text-slate-500 italic"
                  >
                    <span class="font-bold not-italic text-slate-600"
                      >Observação:</span
                    >
                    {{ mov.observacao }}
                  </div>

                  <div
                    class="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm"
                  >
                    <table class="w-full text-sm">
                      <thead class="bg-slate-100/70 border-b border-slate-200">
                        <tr>
                          <th
                            class="py-2.5 px-5 text-left font-bold text-slate-500 text-[10px] uppercase tracking-wider"
                          >
                            Produto
                          </th>
                          <th
                            class="py-2.5 px-5 text-left font-bold text-slate-500 text-[10px] uppercase tracking-wider"
                          >
                            Lote
                          </th>
                          <th
                            class="py-2.5 px-4 text-center font-bold text-slate-500 text-[10px] uppercase tracking-wider"
                          >
                            Validade
                          </th>
                          <th
                            class="py-2.5 px-4 text-center font-bold text-slate-500 text-[10px] uppercase tracking-wider"
                          >
                            Qtd. Solicitada
                          </th>
                          <th
                            class="py-2.5 px-4 text-center font-bold text-slate-500 text-[10px] uppercase tracking-wider"
                          >
                            Qtd. Atendida
                          </th>
                          <th
                            v-if="mov.tipo === 'D'"
                            class="py-2.5 px-4 text-center font-bold text-slate-500 text-[10px] uppercase tracking-wider"
                          >
                            Qtd. Devolvendo
                          </th>
                          <th
                            v-if="mov.status_solicitacao === 'A' && mov.tipo !== 'D'"
                            class="py-2.5 px-4 text-center font-bold text-slate-500 text-[10px] uppercase tracking-wider"
                          >
                            Qtd. Devolvida
                          </th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-100">
                        <tr v-if="!mov.itens || mov.itens.length === 0">
                          <td
                            :colspan="5 + (mov.tipo === 'D' || (mov.status_solicitacao === 'A' && mov.tipo !== 'D') ? 1 : 0)"
                            class="py-6 text-center text-slate-400 italic text-xs"
                          >
                            Nenhum item nesta requisição.
                          </td>
                        </tr>
                        <tr
                          v-for="item in mov.itens"
                          :key="item.id"
                          class="hover:bg-slate-50/70 transition-colors"
                        >
                          <td class="py-3 px-5 font-bold text-slate-700">
                            {{
                              item.produto?.nome || `Produto #${item.produto_id}`
                            }}
                          </td>
                          <!-- Lote: restaura exibição de lotes_parsed, item.lote, mov.lote -->
                          <td class="py-3 px-5">
                            <div v-if="item.lotes_parsed && item.lotes_parsed.length > 0" class="flex flex-wrap gap-1">
                              <span
                                v-for="(lp, li) in item.lotes_parsed"
                                :key="li"
                                class="inline-flex items-center gap-1 text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-mono font-medium"
                              >
                                {{ lp.lote }}<span v-if="lp.qtd" class="font-bold text-slate-900">&times;{{ lp.qtd }}</span>
                              </span>
                            </div>
                            <span v-else-if="item.numero_lote || item.lote || mov.lote" class="inline-flex items-center text-[11px] font-mono font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                              {{ item.numero_lote || item.lote || mov.lote }}
                            </span>
                            <span v-else class="text-xs text-slate-400 font-mono">-</span>
                          </td>
                          <td class="py-3 px-4 text-center">
                            <span v-if="item.validade" class="text-xs font-mono text-slate-600 font-medium">
                              {{ item.validade }}
                            </span>
                            <span v-else-if="item.lotes_parsed?.[0]?.data_vencimento" class="text-xs font-mono text-slate-600 font-medium">
                              {{ formatarData(item.lotes_parsed[0].data_vencimento) }}
                            </span>
                            <span v-else class="text-xs text-slate-300 font-mono">-</span>
                          </td>
                          <td class="py-3 px-4 text-center">
                            <Badge variant="secondary" class="font-black">{{
                              parseInt(item.quantidade_solicitada) || 0
                            }}</Badge>
                          </td>
                          <td class="py-3 px-4 text-center">
                            <Badge
                              v-if="item.quantidade_liberada > 0"
                              class="font-black bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                              >{{ parseInt(item.quantidade_liberada) || 0 }}</Badge
                            >
                            <span
                              v-else
                              class="text-slate-300 font-bold italic text-xs"
                              >Aguardando</span
                            >
                          </td>
                          <td
                            v-if="mov.tipo === 'D'"
                            class="py-3 px-4 text-center font-bold text-amber-600"
                          >
                            {{ parseInt(item.quantidade_devolvendo || item.quantidade_liberada) || 0 }}
                          </td>
                          <!-- Coluna Qtd. Devolvida em pedidos atendidos (permanente) -->
                          <td
                            v-if="mov.status_solicitacao === 'A' && mov.tipo !== 'D'"
                            class="py-3 px-4 text-center"
                          >
                            <Badge
                              v-if="Number(item.quantidade_devolvida || calcularQtdDevolvida(mov, item.id)) > 0"
                              class="font-black bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100"
                              >{{ parseInt(item.quantidade_devolvida || calcularQtdDevolvida(mov, item.id)) }} un devolvidas</Badge
                            >
                            <span v-else class="text-slate-300 font-mono font-bold text-xs">-</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </td>
            </tr>
            </template>
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
        <ArrowLeftRightIcon class="w-12 h-12 text-slate-300" />
      </div>
      <h3 class="text-slate-800 font-bold text-lg">Sem Movimentações</h3>
      <p class="text-slate-500 text-sm max-w-xs text-center mt-2">
        Nenhum registro de transferência foi encontrado para este período ou
        filtros.
      </p>
    </div>

    <!-- Modal de Devolução (Pedido Completo) -->
    <ModalDevolucaoPedido 
      :movimentacao="pedidoParaDevolver"
      @sucesso="onDevolucaoSucesso" 
      @update:open="(val) => { if (!val) pedidoParaDevolver = null; }"
    />

    <ModalNovaMovimentacao
      v-model:open="dialogMovimentacaoOpen"
      :setorId="setorId"
      :setorNome="setorNome"
      :modoInicial="modoInicialMovimentacao"
      :movimentacaoOrigem="movimentacaoParaDevolver"
      @update:open="(val) => { if (!val) movimentacaoParaDevolver = null; }"
    />

    <!-- Modal Editar Rascunho -->
    <ModalNovaMovimentacao
      v-model:open="dialogEditarRascunhoOpen"
      :setorId="setorId"
      :setorNome="setorNome"
      :rascunho="rascunhoParaEditar"
      @registrado="() => location.reload()"
    />

    <!-- Details View: Redesign em 4 Blocos Estruturados (Padrão Hospitalar) -->
    <Dialog v-model:open="dialogDetalhesOpen">
      <DialogContent
        class="max-w-4xl border-none p-0 overflow-hidden bg-slate-50 shadow-2xl rounded-3xl"
      >
        <!-- BLOCO 1: Cabeçalho com Número do Pedido, Tipo Hospitalar e Status -->
        <div class="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-800 p-6 text-white border-b border-slate-700/60">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="space-y-1.5">
              <div class="flex items-center gap-2.5 flex-wrap">
                <span class="text-2xl font-black tracking-tight text-white">
                  Pedido #{{ movimentacaoSelecionada?.numero_pedido || movimentacaoSelecionada?.id }}
                </span>

                <!-- Badge de Tipo Hospitalar -->
                <span
                  v-if="movimentacaoSelecionada?.tipo === 'D'"
                  :class="isEntrada(movimentacaoSelecionada) ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'"
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
                >
                  <span class="text-sm leading-none">{{ isEntrada(movimentacaoSelecionada) ? '📥' : '📤' }}</span>
                  <span>{{ isEntrada(movimentacaoSelecionada) ? 'Devolução Recebida' : 'Devolução ao Distribuidor' }}</span>
                </span>
                <span
                  v-else-if="movimentacaoSelecionada?.tipo === 'C'"
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40"
                >
                  Consumo Interno
                </span>
                <span
                  v-else-if="isEntrada(movimentacaoSelecionada)"
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                >
                  <ArrowDownCircleIcon class="w-3.5 h-3.5" /> Entrada
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40"
                >
                  <ArrowUpCircleIcon class="w-3.5 h-3.5" /> Saída / Transferência
                </span>

                <!-- Badge de Status -->
                <Badge
                  variant="outline"
                  :class="[
                    'text-xs font-black uppercase tracking-wider px-2.5 py-0.5 border shadow-xs',
                    movimentacaoSelecionada?.status_solicitacao === 'A' ? 'bg-emerald-500 text-white border-emerald-400' :
                    movimentacaoSelecionada?.status_solicitacao === 'R' ? 'bg-rose-500 text-white border-rose-400' :
                    movimentacaoSelecionada?.status_solicitacao === 'P' ? 'bg-amber-500 text-white border-amber-400' :
                    movimentacaoSelecionada?.status_solicitacao === 'C' ? 'bg-blue-500 text-white border-blue-400' :
                    'bg-slate-700 text-slate-200 border-slate-600'
                  ]"
                >
                  {{ getStatusBadge(movimentacaoSelecionada?.status_solicitacao).label }}
                </Badge>
              </div>

              <!-- Referência ao Pedido de Origem quando Devolução -->
              <p
                v-if="movimentacaoSelecionada?.tipo === 'D' && (movimentacaoSelecionada?.pedido_origem_id || (movimentacaoSelecionada?.numero_pedido && movimentacaoSelecionada?.numero_pedido !== movimentacaoSelecionada?.id))"
                class="text-xs text-amber-300 font-medium flex items-center gap-1.5"
              >
                <RotateCcwIcon class="w-3.5 h-3.5 text-amber-400" />
                Devolução ref. ao Pedido #{{ movimentacaoSelecionada?.pedido_origem_id || movimentacaoSelecionada?.numero_pedido }}
              </p>
            </div>

            <!-- Ações: Imprimir e Excel -->
            <div class="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                class="gap-1.5 bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white text-xs font-bold"
                @click="imprimir(movimentacaoSelecionada)"
              >
                <PrinterIcon class="w-3.5 h-3.5" /> Imprimir
              </Button>
              <Button
                variant="outline"
                size="sm"
                class="gap-1.5 bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white text-xs font-bold"
                @click="exportarExcel(movimentacaoSelecionada)"
              >
                <FileSpreadsheetIcon class="w-3.5 h-3.5 text-emerald-400" /> Excel
              </Button>
            </div>
          </div>
        </div>

        <div class="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          <!-- BLOCO 2: Rota Estruturada -->
          <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <ArrowLeftRightIcon class="w-3.5 h-3.5 text-slate-500" />
              Rota Estruturada
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] items-center gap-4">
              <!-- Origem -->
              <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div class="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0 mt-0.5">
                  <ArrowUpCircleIcon class="w-4 h-4" />
                </div>
                <div class="min-w-0">
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Origem</span>
                  <p class="text-sm font-black text-slate-900 truncate">
                    {{ formatarSetorComPolo(movimentacaoSelecionada?.setor_origem || movimentacaoSelecionada?.setorOrigem) }}
                  </p>
                </div>
              </div>

              <!-- Seta Rota -->
              <div class="hidden sm:flex items-center justify-center p-2 rounded-full bg-slate-100 text-slate-400">
                <ArrowRightIcon class="w-4 h-4" />
              </div>

              <!-- Destino -->
              <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <div class="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0 mt-0.5">
                  <ArrowDownCircleIcon class="w-4 h-4" />
                </div>
                <div class="min-w-0">
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Destino</span>
                  <p class="text-sm font-black text-slate-900 truncate">
                    {{ formatarSetorComPolo(movimentacaoSelecionada?.setor_destino || movimentacaoSelecionada?.setorDestino) }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- BLOCO 3: Auditoria / Responsáveis -->
          <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <CheckCircle2Icon class="w-3.5 h-3.5 text-slate-500" />
              Auditoria / Responsáveis
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Solicitado por -->
              <div class="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 space-y-1">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UserIcon class="w-3 h-3 text-slate-400" />
                  Solicitado por
                </span>
                <p class="text-sm font-bold text-slate-800">
                  {{ movimentacaoSelecionada?.usuario?.name || "Sistema" }}
                </p>
                <p class="text-xs text-slate-500 flex items-center gap-1">
                  <CalendarIcon class="w-3 h-3" />
                  {{ formatarData(movimentacaoSelecionada?.data_hora || movimentacaoSelecionada?.created_at) }}
                  <span v-if="movimentacaoSelecionada?.data_hora || movimentacaoSelecionada?.created_at">
                    às {{ formatarHora(movimentacaoSelecionada?.data_hora || movimentacaoSelecionada?.created_at) }}
                  </span>
                </p>
              </div>

              <!-- Respondido / Avaliado por -->
              <div class="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100 space-y-1">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2Icon class="w-3 h-3 text-emerald-500" />
                  Respondido / Avaliado por
                </span>
                <template v-if="movimentacaoSelecionada?.aprovador || ['A', 'R'].includes(movimentacaoSelecionada?.status_solicitacao)">
                  <p class="text-sm font-bold text-slate-800">
                    {{ movimentacaoSelecionada?.aprovador?.name || movimentacaoSelecionada?.respondido_por?.name || "Avaliador Autorizado" }}
                  </p>
                  <p class="text-xs text-slate-500 flex items-center gap-1">
                    <CalendarIcon class="w-3 h-3" />
                    {{ formatarData(movimentacaoSelecionada?.updated_at) }} às {{ formatarHora(movimentacaoSelecionada?.updated_at) }}
                  </p>
                </template>
                <template v-else>
                  <p class="text-sm font-medium text-slate-400 italic">Pendente de avaliação</p>
                  <p class="text-xs text-slate-400">—</p>
                </template>
              </div>
            </div>

            <!-- Observações se houver -->
            <div
              v-if="movimentacaoSelecionada?.observacao"
              class="mt-3.5 p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 text-amber-900 text-xs flex items-start gap-2"
            >
              <FileTextIcon class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong class="font-bold">Observações / Motivo:</strong>
                <span class="ml-1 italic text-slate-700">"{{ movimentacaoSelecionada.observacao }}"</span>
              </div>
            </div>
          </div>

          <!-- BLOCO 4: Tabela de Itens Alinhada -->
          <div class="space-y-3">
            <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <FileTextIcon class="w-3.5 h-3.5 text-slate-500" />
              Tabela de Itens
            </h4>
            <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table class="w-full text-sm">
                <thead class="bg-slate-50/90 border-b border-slate-200">
                  <tr>
                    <th class="py-3 px-5 text-left font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                      Produto/Medicamento
                    </th>
                    <th class="py-3 px-4 text-left font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                      Lote
                    </th>
                    <th class="py-3 px-4 text-center font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                      Validade
                    </th>
                    <th class="py-3 px-4 text-center font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                      Qtd Solicitada
                    </th>
                    <th class="py-3 px-4 text-center font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                      Qtd Atendida
                    </th>
                    <th class="py-3 px-4 text-center font-bold text-slate-500 text-[10px] uppercase tracking-wider">
                      Qtd Devolvida
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  <tr v-if="!movimentacaoSelecionada?.itens || movimentacaoSelecionada?.itens.length === 0">
                    <td colspan="6" class="py-6 text-center text-slate-400 italic text-xs">
                      Nenhum item nesta movimentação.
                    </td>
                  </tr>
                  <tr
                    v-for="item in movimentacaoSelecionada?.itens"
                    :key="item.id"
                    class="hover:bg-slate-50/60 transition-colors"
                  >
                    <!-- Produto/Medicamento -->
                    <td class="py-3 px-5 font-bold text-slate-800">
                      <div>
                        {{ item.produto?.nome || `Produto #${item.produto_id}` }}
                      </div>
                      <span v-if="item.produto?.codigo_simpas || item.produto?.codigo_simpass" class="text-[10px] font-mono text-slate-400">
                        SIMPAS: {{ item.produto?.codigo_simpas || item.produto?.codigo_simpass }}
                      </span>
                    </td>

                    <!-- Lote -->
                    <td class="py-3 px-4">
                      <div v-if="item.lotes_parsed && item.lotes_parsed.length > 0" class="flex flex-wrap gap-1">
                        <span
                          v-for="(lp, li) in item.lotes_parsed"
                          :key="li"
                          class="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-mono font-medium"
                        >
                          {{ lp.lote }}<span v-if="lp.qtd" class="font-bold text-slate-900">&times;{{ lp.qtd }}</span>
                        </span>
                      </div>
                      <span v-else-if="item.numero_lote || item.lote || movimentacaoSelecionada?.lote" class="inline-flex items-center text-[11px] font-mono font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                        {{ item.numero_lote || item.lote || movimentacaoSelecionada?.lote }}
                      </span>
                      <span v-else class="text-xs text-slate-400 font-mono">-</span>
                    </td>

                    <!-- Validade -->
                    <td class="py-3 px-4 text-center">
                      <span v-if="item.validade" class="text-xs font-mono text-slate-600 font-medium">
                        {{ item.validade }}
                      </span>
                      <span v-else-if="item.lotes_parsed?.[0]?.data_vencimento" class="text-xs font-mono text-slate-600 font-medium">
                        {{ formatarData(item.lotes_parsed[0].data_vencimento) }}
                      </span>
                      <span v-else class="text-xs text-slate-300 font-mono">-</span>
                    </td>

                    <!-- Qtd Solicitada -->
                    <td class="py-3 px-4 text-center">
                      <Badge variant="secondary" class="font-black">
                        {{ parseInt(item.quantidade_solicitada) || 0 }}
                      </Badge>
                    </td>

                    <!-- Qtd Atendida -->
                    <td class="py-3 px-4 text-center">
                      <Badge
                        v-if="item.quantidade_liberada > 0"
                        class="font-black bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                      >
                        {{ parseInt(item.quantidade_liberada) || 0 }}
                      </Badge>
                      <Badge
                        v-else-if="movimentacaoSelecionada?.tipo === 'D' && (item.quantidade_devolvendo > 0 || item.quantidade_liberada > 0)"
                        class="font-black bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100"
                      >
                        {{ parseInt(item.quantidade_devolvendo || item.quantidade_liberada) || 0 }}
                      </Badge>
                      <span v-else class="text-slate-300 font-bold italic text-xs">
                        Aguardando
                      </span>
                    </td>

                    <!-- Qtd Devolvida -->
                    <td class="py-3 px-4 text-center">
                      <Badge
                        v-if="Number(item.quantidade_devolvida || calcularQtdDevolvida(movimentacaoSelecionada, item.id)) > 0"
                        class="font-black bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100"
                      >
                        {{ parseInt(item.quantidade_devolvida || calcularQtdDevolvida(movimentacaoSelecionada, item.id)) }} un devolvidas
                      </Badge>
                      <span v-else class="text-slate-300 font-mono font-bold text-xs">-</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Approval/Review View -->
    <Dialog v-model:open="dialogAprovacaoOpen">
      <DialogContent
        class="max-w-4xl border-none p-0 overflow-hidden bg-slate-50"
      >
        <div class="bg-emerald-600 p-6 text-white">
          <h2 class="text-xl font-black uppercase tracking-tighter">
            Análise de Solicitação
          </h2>
          <p class="text-emerald-100/80 text-xs font-bold flex items-center gap-2">
            Setor Origem: {{ setorNome }}
            <span class="text-emerald-200/60">â€¢</span>
            Solicitante: <strong class="text-white">{{ movimentacaoParaAprovar?.usuario?.name || "N/A" }}</strong>
            <span class="text-emerald-200/60">â€¢</span>
            Setor Destino: {{ movimentacaoParaAprovar?.setor_destino?.nome_exibicao || movimentacaoParaAprovar?.setor_destino?.nome || "-" }}
          </p>
        </div>

        <div class="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          <!-- Flow Viz -->
          <div
            class="flex items-center justify-between p-6 bg-white rounded-3xl border shadow-sm"
          >
            <div class="text-center space-y-2">
              <div
                class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400"
              >
                <TruckIcon class="w-6 h-6" />
              </div>
              <p class="text-[10px] font-black uppercase text-slate-400">
                Origem (Você)
              </p>
              <p class="text-sm font-bold">{{ setorNome }}</p>
            </div>
            <div class="flex-1 flex flex-col items-center gap-1 mx-4">
              <div class="h-[2px] w-full bg-slate-100 relative">
                <div
                  class="absolute right-0 -top-1 border-y-4 border-l-8 border-y-transparent border-l-slate-200"
                ></div>
              </div>
              <Badge
                variant="outline"
                class="text-[9px] font-black bg-white uppercase"
                >Pendente</Badge
              >
            </div>
            <div class="text-center space-y-2">
              <div
                class="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600 font-black tracking-tighter text-xs"
              >
                DEST
              </div>
              <p class="text-[10px] font-black uppercase text-emerald-500">
                Destino
              </p>
              <p class="text-sm font-bold text-emerald-900">
                {{ movimentacaoParaAprovar?.setor_destino?.nome_exibicao || movimentacaoParaAprovar?.setor_destino?.nome || "-" }}
              </p>
            </div>
          </div>

          <!-- Items Review Table -->
          <div class="space-y-4">
            <h3
              class="text-xs font-black uppercase text-slate-400 tracking-widest px-1"
            >
              Conferência de Itens e Estoque
            </h3>
            <div class="bg-white border rounded-3xl overflow-hidden shadow-sm">
              <table class="w-full text-sm">
                <thead class="bg-slate-50 border-b">
                  <tr>
                    <th
                      class="py-3 px-6 text-left font-bold text-slate-400 text-[10px]"
                    >
                      Produto
                    </th>
                    <th
                      class="py-3 px-6 text-center font-bold text-slate-400 text-[10px]"
                    >
                      Solicitada
                    </th>
                    <th
                      class="py-3 px-6 text-center font-bold text-slate-400 text-[10px]"
                    >
                      Seu Estoque
                    </th>
                    <th
                      v-if="movimentacaoParaAprovar?.status_solicitacao === 'A'"
                      class="py-3 px-6 text-center font-bold text-slate-400 text-[10px] w-48"
                    >
                      Lotes
                    </th>
                    <th
                      class="py-3 px-6 text-center font-bold text-slate-400 text-[10px] w-32"
                    >
                      Liberar
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  <tr
                    v-for="(item, idx) in itensParaAprovacao"
                    :key="idx"
                    :class="
                      item.quantidade_liberada > item.estoque_atual
                        ? 'bg-red-50/50'
                        : ''
                    "
                  >
                    <td class="py-4 px-6 font-bold text-slate-800">
                      {{ item.produto?.nome || item.produtoNome || "-" }}
                    </td>
                    <td class="py-4 px-6 text-center font-black text-slate-500">
                      {{ item.quantidade_solicitada }}
                    </td>
                    <td class="py-4 px-6 text-center">
                      <Badge
                        :variant="
                          item.estoque_atual > 0 ? 'secondary' : 'destructive'
                        "
                        class="font-black"
                        >{{ item.estoque_atual }}</Badge
                      >
                    </td>
                    <td v-if="movimentacaoParaAprovar?.status_solicitacao === 'A'" class="py-4 px-4 text-center">
                      <div v-if="item.lotesConsumidos && item.lotesConsumidos.length > 0" class="flex flex-col gap-1 items-center">
                        <div v-for="(loteItem, i) in item.lotesConsumidos" :key="i" class="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded border flex justify-between items-center w-full max-w-[120px]">
                          <span class="font-bold truncate" :title="loteItem.lote">{{ loteItem.lote }}</span>
                          <span class="font-black bg-white px-1 rounded ml-2">{{ loteItem.qtd }}</span>
                        </div>
                      </div>
                      <span v-else class="text-slate-300 text-xs">-</span>
                    </td>
                    <td class="py-4 px-6">
                      <div class="relative">
                        <Input
                          type="number"
                          step="1"
                          min="0"
                          v-model.number="item.quantidade_liberada"
                          @keydown="(e) => ['e', 'E', '+', '-', '.', ','].includes(e.key) && e.preventDefault()"
                          class="h-9 font-black text-center w-auto min-w-[5rem] px-2 mx-auto"
                          :class="
                            item.quantidade_liberada > item.estoque_atual
                              ? 'border-red-500 text-red-600 bg-red-50'
                              : 'border-emerald-200 focus:ring-emerald-500'
                          "
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Validation Errors -->
          <div
            v-if="
              itensParaAprovacao.some(
                (it) => it.quantidade_liberada > it.estoque_atual,
              )
            "
            class="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3"
          >
            <AlertCircleIcon class="w-5 h-5 text-red-600 shrink-0" />
            <div class="space-y-1">
              <p class="text-sm font-black text-red-900 leading-none">
                Erro de Disponibilidade
              </p>
              <p class="text-xs text-red-700">
                Alguns itens possuem quantidade a liberar superior ao seu
                estoque atual. Ajuste os valores antes de prosseguir.
              </p>
            </div>
          </div>

          <!-- Lot Preview (FIFO) -->
          <div v-if="previewLotesData.length > 0" class="space-y-3">
            <h3
              class="text-xs font-black uppercase text-slate-400 tracking-widest px-1 flex items-center gap-2"
            >
              <CalendarIcon class="w-4 h-4" /> Lotes que serão consumidos (FIFO â€” mais antigo primeiro)
            </h3>

            <!-- No-coverage warning -->
            <div
              v-if="previewLotesData.some((p) => p.quantidade_sem_cobertura > 0)"
              class="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3"
            >
              <AlertCircleIcon class="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div class="space-y-1">
                <p class="text-sm font-black text-amber-900 leading-none">
                  Cobertura insuficiente em lotes
                </p>
                <p class="text-xs text-amber-800">
                  Alguns produtos não possuem saldo suficiente registrado em
                  lotes para cobrir a quantidade solicitada. O estoque agregado
                  será deduzido, mas verifique a consistência dos lotes.
                </p>
              </div>
            </div>

            <div
              v-for="preview in previewLotesData"
              :key="preview.produto_id"
              class="bg-white border rounded-2xl overflow-hidden shadow-sm"
            >
              <div class="px-5 py-3 bg-slate-50 border-b flex items-center justify-between">
                <p class="text-xs font-black text-slate-700 uppercase tracking-wide">
                  {{ preview.produto_nome }}
                </p>
                <Badge
                  v-if="preview.quantidade_sem_cobertura > 0"
                  variant="warning"
                  class="text-[9px] font-black"
                >
                  Sem cobertura: {{ preview.quantidade_sem_cobertura }}
                </Badge>
              </div>
              <table class="w-full text-xs">
                <thead class="bg-slate-50/60 border-b">
                  <tr>
                    <th class="py-2 px-5 text-left font-bold text-slate-400 text-[10px]">Lote</th>
                    <th class="py-2 px-5 text-center font-bold text-slate-400 text-[10px]">Vencimento</th>
                    <th class="py-2 px-5 text-center font-bold text-slate-400 text-[10px]">Qtd disponível</th>
                    <th class="py-2 px-5 text-center font-bold text-slate-400 text-[10px]">Qtd a usar</th>
                  </tr>
                </thead>
                <tbody class="divide-y">
                  <tr
                    v-for="lote in preview.lotes_a_consumir"
                    :key="lote.lote_id"
                    class="hover:bg-slate-50/50"
                  >
                    <td class="py-3 px-5 font-bold text-slate-800">{{ lote.lote || "â€”" }}</td>
                    <td class="py-3 px-5 text-center text-slate-600">
                      {{ lote.data_vencimento ? new Date(lote.data_vencimento).toLocaleDateString('pt-BR') : "â€”" }}
                    </td>
                    <td class="py-3 px-5 text-center">
                      <Badge variant="secondary" class="font-black text-[10px]">{{ lote.quantidade_disponivel }}</Badge>
                    </td>
                    <td class="py-3 px-5 text-center">
                      <Badge class="font-black text-[10px] bg-emerald-100 text-emerald-800 border-emerald-200">{{ lote.quantidade_a_usar }}</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <DialogFooter
          class="p-6 bg-white border-t flex flex-col sm:flex-row gap-3"
        >
          <Button
            variant="ghost"
            class="text-destructive font-bold hover:bg-destructive/5"
            @click="rejeitarMovimentacao"
            :disabled="loadingAprovacao"
          >
            Rejeitar Integramente
          </Button>
          <div class="flex gap-2">
            <Button
              variant="outline"
              @click="dialogAprovacaoOpen = false"
              :disabled="loadingAprovacao"
              >Cancelar</Button
            >
            <Button
              class="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 gap-2 font-black"
              @click="aprovarMovimentacao"
              :disabled="
                loadingAprovacao ||
                itensParaAprovacao.some(
                  (it) => it.quantidade_liberada > it.estoque_atual,
                ) ||
                itensParaAprovacao.every((it) => it.quantidade_liberada <= 0)
              "
            >
              <CheckCircle2Icon v-if="!loadingAprovacao" class="w-4 h-4" />
              {{ loadingAprovacao ? "Processando..." : "Confirmar Liberação" }}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Cancel Dialog -->
    <Dialog v-model:open="dialogCancelamentoOpen">
      <DialogContent
        class="max-w-md border-none p-0 overflow-hidden rounded-3xl"
      >
        <div class="p-8 space-y-6 text-center">
          <div
            class="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2 text-red-600"
          >
            <AlertCircleIcon class="w-10 h-10" />
          </div>
          <div class="space-y-2">
            <h2 class="text-xl font-black text-slate-900">
              Cancelar Solicitação?
            </h2>
            <p class="text-sm text-slate-500 leading-relaxed px-4">
              Esta ação irá invalidar a requisição #{{
                movimentacaoParaCancelar?.id
              }}
              e notificará o setor de origem.
            </p>
          </div>
          <div class="flex flex-col gap-2">
            <Button
              variant="destructive"
              class="h-12 text-sm font-black uppercase tracking-widest shadow-lg shadow-red-200"
              @click="cancelarMovimentacao"
              :disabled="loadingCancelamento"
            >
              {{
                loadingCancelamento
                  ? "Cancelando..."
                  : "Sim, Confirmar Cancelamento"
              }}
            </Button>
            <Button
              variant="ghost"
              class="h-12 font-bold text-slate-400"
              @click="dialogCancelamentoOpen = false"
              :disabled="loadingCancelamento"
              >Voltar</Button
            >
          </div>
        </div>
      </DialogContent>
    </Dialog>
    <!-- Dialog Enviar Rascunho -->
    <Dialog v-model:open="dialogEnviarRascunhoOpen">
      <DialogContent class="max-w-md border-none p-0 overflow-hidden rounded-3xl">
        <div class="p-8 space-y-6 text-center">
          <div class="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2 text-emerald-600">
            <SendIcon class="w-10 h-10" />
          </div>
          <div class="space-y-2">
            <h2 class="text-xl font-black text-slate-900">Enviar Solicitação?</h2>
            <p class="text-sm text-slate-500 leading-relaxed px-4">
              O rascunho #{{ rascunhoParaEnviar?.id }} será enviado como solicitação
              pendente para aprovação do setor de origem.
            </p>
          </div>
          <div class="flex flex-col gap-2">
            <Button
              class="h-12 text-sm font-black uppercase tracking-widest shadow-lg shadow-emerald-200 bg-emerald-600 hover:bg-emerald-700"
              @click="enviarRascunho"
              :disabled="loadingEnvioRascunho"
            >
              {{ loadingEnvioRascunho ? 'Enviando...' : 'Sim, Enviar Solicitação' }}
            </Button>
            <Button variant="ghost" class="h-12 font-bold text-slate-400" @click="dialogEnviarRascunhoOpen = false" :disabled="loadingEnvioRascunho">Voltar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Dialog Excluir Rascunho -->
    <Dialog v-model:open="dialogExcluirRascunhoOpen">
      <DialogContent class="max-w-md border-none p-0 overflow-hidden rounded-3xl">
        <div class="p-8 space-y-6 text-center">
          <div class="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2 text-red-600">
            <Trash2Icon class="w-10 h-10" />
          </div>
          <div class="space-y-2">
            <h2 class="text-xl font-black text-slate-900">Excluir Rascunho?</h2>
            <p class="text-sm text-slate-500 leading-relaxed px-4">
              O rascunho #{{ rascunhoParaExcluir?.id }} será excluído permanentemente.
              Esta ação não pode ser desfeita.
            </p>
          </div>
          <div class="flex flex-col gap-2">
            <Button
              variant="destructive"
              class="h-12 text-sm font-black uppercase tracking-widest shadow-lg shadow-red-200"
              @click="excluirRascunho"
              :disabled="loadingExcluirRascunho"
            >
              {{ loadingExcluirRascunho ? 'Excluindo...' : 'Sim, Excluir Rascunho' }}
            </Button>
            <Button variant="ghost" class="h-12 font-bold text-slate-400" @click="dialogExcluirRascunhoOpen = false" :disabled="loadingExcluirRascunho">Voltar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

