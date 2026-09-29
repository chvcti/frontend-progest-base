<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold flex items-center gap-2">
          <i class="mdi mdi-cart-check text-xl text-blue-600"></i>
          {{ pedidoEmEdicaoId ? `Editar Pedido #${pedidoEmEdicaoId}` : 'Finalizar Pedido' }}
          <span
            v-if="quantidadeProdutos > 0"
            class="text-base font-normal text-muted-foreground"
          >
            ({{ quantidadeProdutos }}
            {{ quantidadeProdutos === 1 ? "item" : "itens" }})
          </span>
        </h2>
        <p class="text-sm text-muted-foreground">
          {{ pedidoEmEdicaoId ? 'Revise os itens e salve as alterações do seu pedido.' : 'Revise e finalize seu pedido.' }}
        </p>
      </div>

      <!-- Banner de Modo de Edição -->
      <div v-if="pedidoEmEdicaoId" class="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-md text-sm">
        <i class="mdi mdi-pencil text-base"></i>
        <span>Modo de edição ativo</span>
        <Button variant="ghost" size="sm" class="h-7 text-xs text-amber-900 hover:bg-amber-100 ml-2" @click="handleCancelarEdicao">
          Cancelar Edição
        </Button>
      </div>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="w-full min-h-[400px] flex items-center justify-center"
    >
      <LoadingSpinner size="lg" />
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Empty State -->
      <Card v-if="itens.length === 0">
        <CardContent class="py-12 text-center">
          <i
            class="mdi mdi-cart-outline text-6xl text-muted-foreground mb-4"
          ></i>
          <h3 class="text-lg font-medium mb-2">Seu pedido está vazio</h3>
          <p class="text-muted-foreground mb-4">
            Adicione itens ao seu pedido para continuar.
          </p>
          <Button @click="adicionarMaisItens">
            <i class="mdi mdi-magnify mr-2"></i>
            Montar Pedido
          </Button>
        </CardContent>
      </Card>

      <!-- Detalhes do Pedido - Layout Horizontal (PRIMEIRO) -->
      <Card v-if="itens.length > 0">
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <i class="mdi mdi-clipboard-text-outline"></i>
            Detalhes do Pedido
          </CardTitle>
        </CardHeader>
        <CardContent>

          <!-- Linha 1: Tipo de Produto + Setor Fornecedor → Setor Destino -->
          <div class="flex flex-wrap items-center gap-4 mb-4">
            <!-- Tipo de Produto -->
            <div class="flex items-center gap-2">
              <i class="mdi mdi-tag-check text-green-600"></i>
              <span class="text-sm font-medium">Tipo de Produto:</span>
              <Badge variant="secondary">
                <i
                  :class="[
                    'mdi mr-1',
                    tipo === 'Medicamento' ? 'mdi-pill' : 'mdi-package-variant',
                  ]"
                ></i>
                {{ tipo || "Não selecionado" }}
              </Badge>
            </div>

            <div
              class="h-6 border-l border-muted-foreground/30 hidden md:block"
            ></div>

            <!-- Setor Distribuidor (primeiro) -->
            <div class="flex-shrink-0 w-[240px]">
              <label class="text-xs text-muted-foreground block mb-1">
                {{ finalidade === 'D' ? 'Devolver Para (Distribuidor)' : 'Setor Distribuidor' }}
              </label>
              <Select
                v-model="distribuidorLocal"
                @update:modelValue="handleDistribuidorChange"
              >
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="Selecione o distribuidor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="setor in distribuidoresDisponiveis"
                    :key="setor.id"
                    :value="String(setor.id)"
                  >
                    {{ setor.nome }} ({{ setor.polo?.sigla || setor.sigla_polo }})
                  </SelectItem>
                </SelectContent>
              </Select>
              <p
                v-if="distribuidoresDisponiveis.length === 0"
                class="text-xs text-muted-foreground mt-1"
              >
                <i class="mdi mdi-alert-circle text-yellow-500 mr-1"></i>
                Nenhum distribuidor configurado.
              </p>
            </div>

            <!-- Seta -->
            <div class="flex items-center">
              <i class="mdi mdi-arrow-right text-2xl text-muted-foreground"></i>
            </div>

            <!-- Setor Destino (segundo) -->
            <div class="flex-shrink-0">
              <label class="text-xs text-muted-foreground block mb-1"
                >Setor de Destino (Você)</label
              >
              <div class="p-2 px-3 bg-muted rounded-lg flex items-center gap-2">
                <i class="mdi mdi-map-marker text-primary"></i>
                <span class="font-medium text-sm">{{
                  setorAtual?.nome || "Setor não identificado"
                }}</span>
              </div>
            </div>
          </div>

          <!-- Linha 2: Observação -->
          <div class="mt-4">
            <label class="text-xs text-muted-foreground block mb-1"
              >Observação (opcional)</label
            >
            <Textarea
              v-model="observacao"
              placeholder="Descreva resumidamente o motivo para qual deseja os itens..."
              class="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      <!-- Cart Items (SEGUNDO) -->
      <Card v-if="itens.length > 0" class="mt-4">
        <CardHeader>
          <div class="flex items-center justify-between">
            <CardTitle class="flex items-center gap-2">
              <i class="mdi mdi-cart"></i>
              Itens do Pedido
            </CardTitle>
            <div class="flex items-center gap-4 text-sm">
              <div class="text-center">
                <span class="text-muted-foreground">Itens:</span>
                <span class="font-bold ml-1">{{ quantidadeProdutos }}</span>
              </div>
              <div class="text-center">
                <span class="text-muted-foreground">Qtd Total:</span>
                <span class="font-bold ml-1">{{ totalItens }}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <div
              v-for="item in itens"
              :key="item.produtoId"
              class="flex items-center justify-between p-3 border rounded-lg hover:shadow-sm transition-shadow"
            >
              <div class="flex-1">
                <div class="font-medium">{{ item.nome }}</div>
                <div class="text-sm text-muted-foreground">
                  <span v-if="item.marca">{{ item.marca }} • </span>
                  <span v-if="item.unidade">{{ item.unidade }}</span>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    class="h-8 w-8"
                    @click="decrementarQuantidade(item.produtoId)"
                  >
                    <i class="mdi mdi-minus"></i>
                  </Button>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    :modelValue="item.quantidade"
                    @keydown="(e) => ['e', 'E', '+', '-', '.', ','].includes(e.key) && e.preventDefault()"
                    @update:modelValue="
                      (val) => updateQuantidade(item.produtoId, Math.max(0, Math.floor(Number(val))))
                    "
                    class="w-auto min-w-[5rem] px-2 text-center h-8"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    class="h-8 w-8"
                    @click="incrementarQuantidade(item.produtoId)"
                  >
                    <i class="mdi mdi-plus"></i>
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 text-destructive hover:text-destructive"
                  @click="removeItem(item.produtoId)"
                >
                  <i class="mdi mdi-delete"></i>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Actions -->
      <div v-if="itens.length > 0" class="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
        <Button
          variant="outline"
          @click="adicionarMaisItens"
          class="flex items-center gap-2 w-full sm:w-auto"
        >
          <i class="mdi mdi-plus"></i>
          Adicionar mais itens
        </Button>

        <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
          <!-- Salvar como Rascunho -->
          <Button
            variant="secondary"
            @click="salvarRascunho"
            :disabled="submitting || distribuidoresDisponiveis.length === 0"
            class="flex items-center gap-2 w-full sm:w-auto"
          >
            <LoadingSpinner v-if="submitting && submittingType === 'C'" size="sm" class="mr-1" />
            <i v-else class="mdi mdi-file-document-edit-outline"></i>
            {{ pedidoEmEdicaoId ? "Salvar Rascunho" : "Salvar como Rascunho" }}
          </Button>

          <!-- Finalizar / Enviar Pedido -->
          <Button
            @click="enviarPedido"
            :disabled="submitting || distribuidoresDisponiveis.length === 0"
            class="flex items-center gap-2 w-full sm:w-auto text-white bg-blue-600 hover:bg-blue-700"
          >
            <LoadingSpinner v-if="submitting && submittingType === 'P'" size="sm" class="mr-1" />
            <i v-else class="mdi mdi-send"></i>
            {{ pedidoEmEdicaoId ? "Enviar Pedido" : "Finalizar Pedido" }}
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoadingSpinner from "@/components/ui/loading-spinner/LoadingSpinner.vue";
import { useToast } from "@/components/ui/toast";
import { useSolicitacao } from "@/composables/useSolicitacao";
import { useStore } from "vuex";

const router = useRouter();
const store = useStore();
const { toast } = useToast();
const finalidade = ref("S"); // 'S' = Pedido, 'D' = Devolução

const {
  tipo,
  itens,
  distribuidor,
  pedidoEmEdicaoId,
  observacaoEmEdicao,
  quantidadeProdutos,
  totalItens,
  setorAtual,
  distribuidoresDisponiveis,
  updateQuantidade,
  removeItem,
  setDistribuidor,
  cancelarEdicao,
  limparPedido,
  getPedidoParaEnvio,
} = useSolicitacao();

const loading = ref(false);
const submitting = ref(false);
const submittingType = ref(null);
const observacao = ref(observacaoEmEdicao.value || "");
const distribuidorLocal = ref(distribuidor.value ? String(distribuidor.value) : null);

// Sync com composable
watch(distribuidor, (newVal) => {
  distribuidorLocal.value = newVal ? String(newVal) : null;
});

watch(observacaoEmEdicao, (newVal) => {
  if (newVal) observacao.value = newVal;
});

const handleDistribuidorChange = (value) => {
  setDistribuidor(value ? Number(value) : null);
};

const handleCancelarEdicao = () => {
  cancelarEdicao();
  observacao.value = "";
  distribuidorLocal.value = null;
  toast({
    title: "Edição cancelada",
    description: "Modo de edição finalizado.",
  });
};

const incrementarQuantidade = (produtoId) => {
  const item = itens.value.find((i) => i.produtoId === produtoId);
  if (item) {
    updateQuantidade(produtoId, item.quantidade + 1);
  }
};

const decrementarQuantidade = (produtoId) => {
  const item = itens.value.find((i) => i.produtoId === produtoId);
  if (item && item.quantidade > 1) {
    updateQuantidade(produtoId, item.quantidade - 1);
  }
};

const adicionarMaisItens = () => {
  router.replace({ query: { tab: "itens" } });
};

const salvarRascunho = () => processarEnvio("C");
const enviarPedido = () => processarEnvio("P");

const processarEnvio = async (statusTarget) => {
  if (!distribuidorLocal.value) {
    toast({
      title: "Atenção",
      description: "Por favor, selecione o setor distribuidor.",
      variant: "destructive",
    });
    return;
  }

  if (itens.value.length === 0) {
    toast({
      title: "Atenção",
      description: "Adicione pelo menos um item ao pedido.",
      variant: "destructive",
    });
    return;
  }

  setDistribuidor(Number(distribuidorLocal.value));
  const pedidoData = getPedidoParaEnvio(statusTarget, observacao.value);

  if (!pedidoData) {
    toast({
      title: "Erro",
      description: "Não foi possível preparar o pedido. Verifique os dados.",
      variant: "destructive",
    });
    return;
  }

  // Se for devolução, ajusta tipo e inverte origem (solicitante) e destino (distribuidor)
  if (finalidade.value === "D") {
    pedidoData.tipo = "D";
    pedidoData.setor_origem_id = Number(store.state.estoque.setorAtualId);
    pedidoData.setor_destino_id = Number(distribuidorLocal.value);
  }

  try {
    submitting.value = true;
    submittingType.value = statusTarget;
    const token =
      store?.getters?.["auth/getUserToken"] ||
      store?.getters?.getUserToken ||
      sessionStorage.getItem("token") ||
      localStorage.getItem("token");
    const authHeaders = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

    let response;

    // Se estiver editando um pedido existente
    if (pedidoEmEdicaoId.value) {
      const editId = pedidoEmEdicaoId.value;
      
      // Se era rascunho e vai continuar rascunho
      if (statusTarget === "C") {
        response = await axios.post(`/movimentacao/${editId}/update-rascunho`, {
          setor_origem_id: pedidoData.setor_origem_id,
          observacao: pedidoData.observacao,
          itens: pedidoData.itens,
          status_solicitacao: "C",
        }, authHeaders);
      } else {
        // Atualiza itens do rascunho e submete
        await axios.post(`/movimentacao/${editId}/update-rascunho`, {
          setor_origem_id: pedidoData.setor_origem_id,
          observacao: pedidoData.observacao,
          itens: pedidoData.itens,
        }, authHeaders);

        response = await axios.post(`/movimentacao/${editId}/process`, {
          action: "submit",
        }, authHeaders);
      }
    } else {
      // Criação de nova movimentação
      response = await axios.post("/movimentacao/add", pedidoData, authHeaders);
    }

    if (response.data.status) {
      let mensagemSucesso = statusTarget === "C"
        ? "Rascunho salvo com sucesso!"
        : "Pedido enviado com sucesso! Aguarde a aprovação.";

      if (finalidade.value === "D" && statusTarget === "P") {
        mensagemSucesso = "Devolução registrada com sucesso! Aguarde a conferência do distribuidor.";
      }

      toast({
        title: "Sucesso",
        description: mensagemSucesso,
      });

      // Limpar pedido após sucesso
      limparPedido();
      observacao.value = "";
      distribuidorLocal.value = null;

      // Navegar para histórico após 1 segundo
      setTimeout(() => {
        router.replace({ query: { tab: "historico" } });
      }, 1000);
    } else {
      throw new Error(response.data.message || "Erro ao salvar pedido");
    }
  } catch (error) {
    console.error("Erro ao processar pedido:", error);
    toast({
      title: "Erro",
      description:
        error.response?.data?.message || "Não foi possível concluir a operação.",
      variant: "destructive",
    });
  } finally {
    submitting.value = false;
    submittingType.value = null;
  }
};

onMounted(() => {
  if (observacaoEmEdicao.value) {
    observacao.value = observacaoEmEdicao.value;
  }
  if (distribuidor.value) {
    distribuidorLocal.value = String(distribuidor.value);
  }
});
</script>
