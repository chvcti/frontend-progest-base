// Composable para gerenciar o estado compartilhado da solicitação
import { ref, computed, watch } from "vue";
import { useStore } from "vuex";

// Estado global reativo (fora do composable para persistir entre componentes)
const tipoSelecionado = ref(null);
const itensPedido = ref([]);
const distribuidorSelecionado = ref(null);
const editingPedidoId = ref(null);
const editingObservacao = ref("");

// Carregar do localStorage na inicialização
const savedState = localStorage.getItem("solicitacaoState");
if (savedState) {
  try {
    const parsed = JSON.parse(savedState);
    tipoSelecionado.value = parsed.tipo || null;
    itensPedido.value = parsed.itens || [];
    distribuidorSelecionado.value = parsed.distribuidor || parsed.fornecedor || null;
    editingPedidoId.value = parsed.editingPedidoId || null;
    editingObservacao.value = parsed.editingObservacao || "";
  } catch (e) {
    console.error("Erro ao carregar estado da solicitação:", e);
  }
}

// Salvar no localStorage quando mudar
watch(
  [tipoSelecionado, itensPedido, distribuidorSelecionado, editingPedidoId, editingObservacao],
  () => {
    localStorage.setItem(
      "solicitacaoState",
      JSON.stringify({
        tipo: tipoSelecionado.value,
        itens: itensPedido.value,
        distribuidor: distribuidorSelecionado.value,
        editingPedidoId: editingPedidoId.value,
        editingObservacao: editingObservacao.value,
      })
    );
  },
  { deep: true }
);

export function useSolicitacao() {
  const store = useStore();

  // Refs exportadas
  const tipo = computed(() => tipoSelecionado.value);
  const itens = computed(() => itensPedido.value);
  const distribuidor = computed(() => distribuidorSelecionado.value);
  const pedidoEmEdicaoId = computed(() => editingPedidoId.value);
  const observacaoEmEdicao = computed(() => editingObservacao.value);

  // Contadores
  const quantidadeProdutos = computed(() => itensPedido.value.length);
  const totalItens = computed(() =>
    itensPedido.value.reduce((acc, item) => acc + (item.quantidade || 0), 0)
  );

  // Setor atual do usuário
  const setorAtual = computed(() => store.state.estoque.setorDetails);

  // Distribuidores disponíveis para o setor atual
  const distribuidoresDisponiveis = computed(() => {
    const details = store.state.estoque.setorDetails;
    if (!details) return [];

    const relacionamentos = details.distribuidores_relacionados || [];

    return relacionamentos
      .filter((rel) => {
        const distribuidorId =
          rel.setor_distribuidor_id || rel.setor_fornecedor_id || rel.fornecedor_id || rel.id;
        return distribuidorId != null;
      })
      .map((rel) => {
        const distribuidorId = rel.setor_distribuidor_id || rel.setor_fornecedor_id || rel.fornecedor_id;
        const distribuidorNome =
          rel.distribuidor?.nome ||
          rel.fornecedor?.nome ||
          rel.setor_fornecedor?.nome ||
          rel.nome ||
          `Setor ${distribuidorId}`;

        return {
          ...rel,
          id: distribuidorId,
          nome: distribuidorNome,
          tipo: rel.tipo_produto || null,
          polo: rel.distribuidor?.polo || rel.polo,
          sigla_polo: rel.distribuidor?.polo?.sigla || rel.sigla_polo || rel.polo?.sigla,
        };
      });
  });

  // Funções
  const setTipo = (novoTipo) => {
    if (
      tipoSelecionado.value &&
      tipoSelecionado.value !== novoTipo &&
      itensPedido.value.length > 0 &&
      !editingPedidoId.value
    ) {
      itensPedido.value = [];
    }
    tipoSelecionado.value = novoTipo;
  };

  const addItem = (produto, quantidade) => {
    const existingIndex = itensPedido.value.findIndex(
      (item) => item.produtoId === produto.id
    );

    if (existingIndex >= 0) {
      itensPedido.value[existingIndex].quantidade += quantidade;
    } else {
      itensPedido.value.push({
        produtoId: produto.id,
        nome: produto.nome,
        marca: produto.marca || "",
        unidade:
          produto.unidade_medida?.sigla || produto.unidade_medida?.nome || "",
        quantidade: quantidade,
      });
    }
  };

  const removeItem = (produtoId) => {
    const index = itensPedido.value.findIndex(
      (item) => item.produtoId === produtoId
    );
    if (index >= 0) {
      itensPedido.value.splice(index, 1);
    }
  };

  const updateQuantidade = (produtoId, novaQuantidade) => {
    const item = itensPedido.value.find((i) => i.produtoId === produtoId);
    if (item) {
      item.quantidade = Math.max(1, novaQuantidade);
    }
  };

  const setDistribuidor = (distribuidorId) => {
    distribuidorSelecionado.value = distribuidorId;
  };

  const carregarPedidoParaEdicao = (pedido) => {
    editingPedidoId.value = pedido.id;
    editingObservacao.value = pedido.observacao || "";
    distribuidorSelecionado.value = pedido.setor_origem_id;

    if (pedido.itens && pedido.itens.length > 0) {
      const primeiroProduto = pedido.itens[0]?.produto;
      if (primeiroProduto?.tipo) {
        tipoSelecionado.value = primeiroProduto.tipo;
      }
      itensPedido.value = pedido.itens.map((it) => ({
        produtoId: it.produto_id,
        nome: it.produto?.nome || `Produto #${it.produto_id}`,
        marca: it.produto?.marca || "",
        unidade:
          it.produto?.unidade_medida?.sigla ||
          it.produto?.unidade_medida?.nome ||
          "",
        quantidade: Number(it.quantidade_solicitada || 1),
      }));
    } else {
      itensPedido.value = [];
    }
  };

  const cancelarEdicao = () => {
    editingPedidoId.value = null;
    editingObservacao.value = "";
    itensPedido.value = [];
    distribuidorSelecionado.value = null;
  };

  const limparPedido = () => {
    itensPedido.value = [];
    distribuidorSelecionado.value = null;
    editingPedidoId.value = null;
    editingObservacao.value = "";
  };

  const limparTudo = () => {
    tipoSelecionado.value = null;
    itensPedido.value = [];
    distribuidorSelecionado.value = null;
    editingPedidoId.value = null;
    editingObservacao.value = "";
    localStorage.removeItem("solicitacaoState");
  };

  const getPedidoParaEnvio = (status = "P", observacao = "") => {
    if (!distribuidorSelecionado.value || itensPedido.value.length === 0) {
      return null;
    }

    const userId = store.state.auth.user?.id;
    const setorDestinoId = store.state.estoque.setorAtualId;

    if (!userId || !setorDestinoId) {
      console.error("Dados do usuário ou setor não disponíveis");
      return null;
    }

    return {
      usuario_id: userId,
      setor_origem_id: Number(distribuidorSelecionado.value),
      setor_destino_id: Number(setorDestinoId),
      tipo: "S", // Solicitação
      status_solicitacao: status, // P (Pendente) ou C (Rascunho)
      observacao: observacao,
      itens: itensPedido.value.map((item) => ({
        produto_id: item.produtoId,
        quantidade_solicitada: item.quantidade,
      })),
    };
  };

  return {
    // Estado
    tipo,
    itens,
    distribuidor,
    pedidoEmEdicaoId,
    observacaoEmEdicao,
    quantidadeProdutos,
    totalItens,
    setorAtual,
    distribuidoresDisponiveis,

    // Funções
    setTipo,
    addItem,
    removeItem,
    updateQuantidade,
    setDistribuidor,
    carregarPedidoParaEdicao,
    cancelarEdicao,
    limparPedido,
    limparTudo,
    getPedidoParaEnvio,
  };
}
