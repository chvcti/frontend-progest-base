<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold flex items-center gap-2">
          <i class="mdi mdi-history text-xl text-blue-600"></i>
          Histórico de Pedidos
        </h2>
        <p class="text-sm text-muted-foreground">
          Acompanhe o status, edite rascunhos ou cancele pedidos pendentes.
        </p>
      </div>

      <div class="flex items-center gap-2">
        <div class="relative">
          <i class="mdi mdi-magnify absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-base"></i>
          <Input 
            v-model="searchLote" 
            placeholder="Buscar por lote..." 
            class="pl-9 h-8 text-sm w-52"
            @keyup.enter="fetchPedidos"
          />
        </div>

        <!-- Exporta todos os pedidos da lista -->
        <Button
          variant="outline"
          size="sm"
          @click="exportarTodosExcel"
          :disabled="loading || pedidos.length === 0"
          class="flex items-center gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
        >
          <i class="mdi mdi-file-excel"></i>
          Exportar Excel
        </Button>

        <Button variant="outline" size="sm" @click="fetchPedidos" :disabled="loading" class="flex items-center gap-1.5">
          <i class="mdi mdi-refresh" :class="{ 'animate-spin': loading }"></i>
          Atualizar
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

    <!-- Empty State -->
    <Card v-else-if="pedidos.length === 0">
      <CardContent class="py-12 text-center">
        <i
          class="mdi mdi-package-variant text-6xl text-muted-foreground mb-4"
        ></i>
        <h3 class="text-lg font-medium mb-2">Nenhum pedido encontrado</h3>
        <p class="text-muted-foreground mb-4">
          Você ainda não fez nenhum pedido ou rascunho.
        </p>
        <Button @click="irParaBuscar">
          <i class="mdi mdi-magnify mr-2"></i>
          Montar Pedido
        </Button>
      </CardContent>
    </Card>

    <!-- Pedidos List -->
    <div v-else class="space-y-4">
      <Card v-for="pedido in pedidos" :key="pedido.id" class="overflow-hidden transition-all duration-200" :class="{ 'border-amber-300 bg-amber-50/20': pedido.status_solicitacao === 'C' }">
        <CardHeader class="pb-2">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <CardTitle class="text-lg flex items-center gap-2">
                <span v-if="pedido.tipo === 'D'">Devolução #{{ pedido.numero_pedido || pedido.id }}</span>
                <span v-else>Pedido #{{ pedido.numero_pedido || pedido.id }}</span>
                <span v-if="pedido.status_solicitacao === 'C'" class="text-xs font-normal text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  Rascunho não enviado
                </span>
              </CardTitle>
              <Badge :variant="getStatusVariant(pedido.status_solicitacao)">
                {{ getStatusLabel(pedido.status_solicitacao) }}
              </Badge>
              <Badge v-if="pedido.tipo === 'D' && (pedido.pedido_origem_id || extrairPedidoRef(pedido))" variant="outline" class="border-amber-400 text-amber-900 bg-amber-50 font-bold px-2.5 py-0.5 shadow-xs text-xs">
                <i class="mdi mdi-keyboard-return mr-1 text-amber-600"></i>
                Devolução referente ao Pedido #{{ pedido.pedido_origem_id || extrairPedidoRef(pedido) }}
              </Badge>
              <Badge v-else-if="pedido.tem_devolucao" variant="outline" class="border-amber-500 text-amber-700 bg-amber-50">
                <i class="mdi mdi-keyboard-return mr-1"></i> Possui Devoluções
              </Badge>
            </div>
            <div class="text-sm text-muted-foreground">
              {{ formatDate(pedido.data_hora) }}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <!-- Info do pedido e Ações -->
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex flex-wrap items-center gap-4 text-sm">
                <div class="flex items-center gap-2">
                  <i class="mdi mdi-store text-muted-foreground"></i>
                  <span class="text-muted-foreground">Distribuidor:</span>
                  <span class="font-medium">
                    {{ pedido.setor_origem?.nome_exibicao || pedido.setor_origem?.nome || "N/A" }}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <i class="mdi mdi-map-marker text-blue-600"></i>
                  <span class="text-muted-foreground">Destino:</span>
                  <span class="font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {{ pedido.setor_destino?.nome_exibicao || pedido.setor_destino?.nome || "N/A" }}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <i class="mdi mdi-package-variant text-muted-foreground"></i>
                  <span class="text-muted-foreground">Itens:</span>
                  <span class="font-medium">
                    {{ pedido.itens?.length || 0 }}
                  </span>
                </div>
                <!-- Solicitante / Criador -->
                <div class="flex items-center gap-2">
                  <i class="mdi mdi-account text-muted-foreground"></i>
                  <span class="text-muted-foreground">Solicitante:</span>
                  <span class="font-medium text-slate-800">
                    {{ pedido.usuario?.name || "Não informado" }}
                  </span>
                </div>
                <!-- Aprovador / Avaliador (quando já avaliado) -->
                <div v-if="['A', 'R'].includes(pedido.status_solicitacao)" class="flex items-center gap-2">
                  <i class="mdi mdi-account-check text-muted-foreground"></i>
                  <span class="text-muted-foreground">
                    {{ pedido.status_solicitacao === 'A' ? 'Aprovado por:' : 'Reprovado por:' }}
                  </span>
                  <span class="font-medium" :class="pedido.status_solicitacao === 'A' ? 'text-green-700' : 'text-red-600'">
                    {{ pedido.aprovador?.name || pedido.respondido_por?.name || 'Avaliado' }}
                  </span>
                </div>
              </div>

              <!-- Botões de Ação -->
              <div class="flex items-center gap-1.5 self-end sm:self-auto">
                <!-- RASCUNHO: Enviar Agora -->
                <Button
                  v-if="pedido.status_solicitacao === 'C'"
                  size="sm"
                  variant="default"
                  @click.stop="enviarParaAnalise(pedido)"
                  :disabled="actionInProgress === pedido.id"
                  class="h-8 px-2.5 bg-green-600 hover:bg-green-700 text-white text-xs flex items-center gap-1"
                  title="Enviar Rascunho para Análise"
                >
                  <LoadingSpinner v-if="actionInProgress === pedido.id" size="sm" />
                  <i v-else class="mdi mdi-send text-sm"></i>
                  <span>Enviar</span>
                </Button>

                <!-- RASCUNHO: Editar (Apenas rascunhos podem ser editados) -->
                <Button
                  v-if="pedido.status_solicitacao === 'C'"
                  variant="outline"
                  size="sm"
                  @click.stop="editarPedido(pedido)"
                  class="h-8 px-2.5 text-xs flex items-center gap-1"
                  title="Editar Rascunho"
                >
                  <i class="mdi mdi-pencil text-sm text-blue-600"></i>
                  <span>Editar</span>
                </Button>

                <!-- RASCUNHO: Excluir -->
                <Button
                  v-if="pedido.status_solicitacao === 'C'"
                  variant="ghost"
                  size="icon"
                  @click.stop="abrirExcluirRascunho(pedido)"
                  :disabled="actionInProgress === pedido.id"
                  class="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="Excluir Rascunho"
                >
                  <i class="mdi mdi-delete-outline text-lg"></i>
                </Button>

                <!-- PENDENTE: Cancelar -->
                <Button
                  v-if="pedido.status_solicitacao === 'P'"
                  variant="ghost"
                  size="icon"
                  @click.stop="abrirCancelarPedido(pedido)"
                  :disabled="actionInProgress === pedido.id"
                  class="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="Cancelar Pedido"
                >
                  <LoadingSpinner v-if="actionInProgress === pedido.id" size="sm" />
                  <i v-else class="mdi mdi-close-circle-outline text-lg"></i>
                </Button>

                <!-- APROVADO: Imprimir -->
                <Button
                  v-if="pedido.status_solicitacao === 'A'"
                  variant="ghost"
                  size="icon"
                  @click.stop="imprimirPedido(pedido)"
                  class="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  title="Imprimir Pedido"
                >
                  <i class="mdi mdi-printer text-lg"></i>
                </Button>

                <!-- APROVADO: Devolver (Apenas para pedidos que não sejam devolução) -->
                <Button
                  v-if="(pedido.status === 'A' || pedido.status_solicitacao === 'A') && pedido.tipo !== 'D'"
                  variant="outline"
                  size="sm"
                  @click.stop="abrirModalDevolucao(pedido)"
                  class="h-7 text-xs font-semibold text-amber-600 border-amber-300 hover:bg-amber-50 hover:text-amber-700 flex items-center gap-1"
                  title="Devolver itens deste pedido"
                >
                  <i class="mdi mdi-keyboard-return"></i> Devolver
                </Button>

                <!-- Exportar este pedido em Excel (qualquer status) -->
                <Button
                  variant="ghost"
                  size="icon"
                  @click.stop="exportarExcel(pedido)"
                  class="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                  title="Exportar Pedido em Excel"
                >
                  <i class="mdi mdi-file-excel text-lg"></i>
                </Button>
              </div>
            </div>

            <!-- Observação -->
            <div v-if="extrairObservacaoLimpa(pedido.observacao)" class="text-sm bg-muted/50 p-2 rounded">
              <span class="text-muted-foreground font-medium">Obs:</span>
              <span class="ml-1 text-slate-700">{{ extrairObservacaoLimpa(pedido.observacao) }}</span>
            </div>

            <!-- Expandir detalhes -->
            <div class="pt-1">
              <Button
                variant="ghost"
                size="sm"
                @click="toggleExpand(pedido.id)"
                class="text-xs h-7 px-2"
              >
                <i
                  :class="[
                    'mdi mr-1',
                    expanded[pedido.id] ? 'mdi-chevron-up' : 'mdi-chevron-down',
                  ]"
                ></i>
                {{ expanded[pedido.id] ? "Ocultar itens" : `Ver itens (${pedido.itens?.length || 0})` }}
              </Button>
            </div>

            <!-- Itens expandidos -->
            <div
              v-if="expanded[pedido.id] && pedido.itens"
              class="border-t pt-3 mt-2"
            >
              <div class="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-xs">
                <table class="w-full text-xs text-left">
                  <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th class="py-2.5 px-3">Produto / Medicamento</th>
                      <th class="py-2.5 px-3 text-center">Lote</th>
                      <th class="py-2.5 px-3 text-center">Validade</th>
                      <th class="py-2.5 px-3 text-right">Qtd Solicitada</th>
                      <th v-if="pedido.status_solicitacao === 'A'" class="py-2.5 px-3 text-right">Qtd Devolvida</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    <tr v-for="item in pedido.itens" :key="item.id" class="hover:bg-slate-50/70 transition-colors">
                      <td class="py-2.5 px-3 font-medium text-slate-900">
                        {{ item.produto?.nome || `Produto #${item.produto_id}` }}
                        <span v-if="item.produto?.marca" class="text-[11px] text-slate-500 font-normal ml-1">
                          ({{ item.produto.marca }})
                        </span>
                      </td>
                      <td class="py-2.5 px-3 text-center font-mono">
                        <span v-if="formatarItemLote(item) !== '-'" class="px-2 py-0.5 rounded bg-slate-100 text-slate-800 text-[11px] font-semibold">
                          {{ formatarItemLote(item) }}
                        </span>
                        <span v-else class="text-slate-400">-</span>
                      </td>
                      <td class="py-2.5 px-3 text-center text-slate-600">
                        {{ formatarItemValidade(item) }}
                      </td>
                      <td class="py-2.5 px-3 text-right text-slate-700 font-medium">
                        {{ item.quantidade_solicitada }}
                      </td>
                      <td v-if="pedido.status_solicitacao === 'A'" class="py-2.5 px-3 text-right">
                        <span
                          v-if="calcularQtdDevolvida(pedido, item) > 0"
                          class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300"
                        >
                          {{ calcularQtdDevolvida(pedido, item) }} un devolvidas
                        </span>
                        <span v-else class="text-slate-400 font-normal">-</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Histórico de Devoluções do Pedido -->
              <div v-if="pedido.devolucoes && pedido.devolucoes.length > 0" class="mt-4 border border-amber-200 bg-amber-50/40 rounded-lg p-3">
                <h4 class="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <i class="mdi mdi-history text-amber-700 text-sm"></i> Histórico de Devoluções Registradas
                </h4>
                <div class="space-y-2">
                  <div v-for="dev in pedido.devolucoes" :key="dev.id" class="text-xs text-slate-700 flex flex-wrap gap-x-3 gap-y-1.5 items-center bg-white border border-amber-200 p-2.5 rounded-md shadow-xs">
                    <Badge variant="outline" class="font-bold text-amber-900 bg-amber-100 border-amber-300">
                      Devolução referente ao Pedido #{{ pedido.pedido_origem_id || extrairPedidoRef(pedido) || pedido.id }}
                    </Badge>
                    <span><strong>Item:</strong> {{ pedido.itens?.find(i => i.id === dev.item_movimentacao_id)?.produto?.nome || 'Item #' + dev.item_movimentacao_id }}</span>
                    <span><strong>Lote:</strong> <span class="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded font-mono font-medium">{{ formatarItemLote({ lote: dev.lote }) }}</span></span>
                    <span><strong>Qtd:</strong> <span class="text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">{{ dev.quantidade }} un</span></span>
                    <span class="text-slate-500"><strong>Data:</strong> {{ formatDate(dev.created_at) }}</span>
                    <span v-if="dev.usuario" class="text-muted-foreground"><strong>Por:</strong> {{ dev.usuario.name }}</span>
                    <div v-if="dev.motivo" class="w-full text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-200 text-xs mt-1">
                      <span class="font-semibold text-slate-700">Motivo:</span> {{ dev.motivo }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Alert Dialog para confirmar cancelamento de pedido pendente -->
    <AlertDialog v-model:open="showCancelDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar Pedido</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja realmente cancelar o Pedido #{{ pedidoSelecionado?.id }}?
            Esta ação não poderá ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Não, manter pedido</AlertDialogCancel>
          <AlertDialogAction
            @click="confirmarCancelamento"
            class="bg-red-600 hover:bg-red-700 text-white"
          >
            Sim, cancelar pedido
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <!-- Alert Dialog para confirmar exclusão de rascunho -->
    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir Rascunho</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja realmente excluir o Rascunho #{{ pedidoSelecionado?.id }}?
            Todos os itens salvos neste rascunho serão removidos.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Não, manter rascunho</AlertDialogCancel>
          <AlertDialogAction
            @click="confirmarExclusaoRascunho"
            class="bg-red-600 hover:bg-red-700 text-white"
          >
            Sim, excluir rascunho
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    
    <ModalDevolucaoPedido 
      :movimentacao="pedidoParaDevolver"
      @sucesso="fetchPedidos"
      @update:open="(val) => { if (!val) pedidoParaDevolver = null; }"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LoadingSpinner from "@/components/ui/loading-spinner/LoadingSpinner.vue";
import { useToast } from "@/components/ui/toast";
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
import { useSolicitacao } from "@/composables/useSolicitacao";
import { imprimirPedido as gerarImpressaoPedido } from "@/utils/imprimirPedido";
import {
  exportarPedidoExcel,
  exportarPedidosExcel,
} from "@/utils/exportarPedidoExcel";
import { Input } from "@/components/ui/input";
import ModalDevolucaoPedido from "./ModalDevolucaoPedido.vue";
import { setorCookie } from "@/utils/setorCookie";
import { usePedidosStateMachine } from "@/composables/usePedidosStateMachine";

const router = useRouter();
const store = useStore();
const { toast } = useToast();
const { carregarPedidoParaEdicao } = useSolicitacao();

const searchLote = ref("");
const pedidoParaDevolver = ref(null);

const pedidos = ref([]);
const loading = ref(true);
const expanded = ref({});
const showCancelDialog = ref(false);
const showDeleteDialog = ref(false);
const pedidoSelecionado = ref(null);

const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const extrairObservacaoLimpa = (obs) => {
  if (!obs) return "";
  return obs.replace(/\[?Devoluç[aã]o\s+ref(\.|erente\s+ao)?\s+Pedido\s*#?\d+\]?[:\s-]*/i, "").trim();
};

const extrairPedidoRef = (pedido) => {
  if (pedido.pedido_origem_id) return pedido.pedido_origem_id;
  if (pedido.observacao) {
    const match = pedido.observacao.match(/pedido\s*#?(\d+)/i);
    if (match) return match[1];
  }
  return null;
};

const limparStringLote = (str) => {
  if (!str) return "";
  let res = String(str).trim();
  // Remove qualquer sufixo redundante como (Validade: DD/MM/AAAA) ou - Validade:...
  res = res.replace(/\s*\([Vv]alidade:?[^)]*\)/g, "");
  res = res.replace(/\s*-\s*[Vv]alidade:?.*$/i, "");
  // Remove prefixo Lote: se houver
  res = res.replace(/^[Ll]ote:\s*/i, "");
  return res.trim();
};

const formatarLoteAmigavel = (rawLote) => {
  if (!rawLote) return "-";

  // Se já for array ou objeto
  if (typeof rawLote === "object") {
    if (Array.isArray(rawLote)) {
      if (rawLote.length === 0) return "-";
      return (
        rawLote
          .map((l) => {
            const val = l.lote || l.numero_lote || (typeof l === "string" ? l : "");
            return limparStringLote(val);
          })
          .filter(Boolean)
          .join(", ") || "-"
      );
    }

    const val = rawLote.lote || rawLote.numero_lote || "";
    return limparStringLote(val) || "-";
  }

  // Se for string
  if (typeof rawLote === "string") {
    const trimmed = rawLote.trim();
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        const parsed = JSON.parse(trimmed);
        return formatarLoteAmigavel(parsed);
      } catch (e) {
        return limparStringLote(trimmed) || "-";
      }
    }
    return limparStringLote(trimmed) || "-";
  }

  return limparStringLote(String(rawLote)) || "-";
};

const formatarItemLote = (item) => {
  if (!item) return "-";
  if (Array.isArray(item.lotes_parsed) && item.lotes_parsed.length > 0) {
    return formatarLoteAmigavel(item.lotes_parsed);
  }
  if (item.lote) {
    return formatarLoteAmigavel(item.lote);
  }
  if (item.numero_lote) {
    return formatarLoteAmigavel(item.numero_lote);
  }
  return "-";
};

const formatarItemValidade = (item) => {
  if (!item) return "-";
  if (item.validade) {
    try {
      const d = new Date(item.validade);
      if (!isNaN(d.getTime()) && String(item.validade).includes("-")) {
        return d.toLocaleDateString("pt-BR");
      }
    } catch (e) {}
    return item.validade;
  }
  if (Array.isArray(item.lotes_parsed) && item.lotes_parsed.length > 0) {
    const validades = item.lotes_parsed
      .map((lp) => {
        const val = lp.data_vencimento || lp.validade || lp.data_validade;
        if (!val) return null;
        try {
          const d = new Date(val);
          if (!isNaN(d.getTime())) return d.toLocaleDateString("pt-BR");
        } catch (e) {}
        return val;
      })
      .filter(Boolean);
    if (validades.length > 0) return [...new Set(validades)].join(", ");
  }
  if (typeof item.lote === "string") {
    try {
      const parsed = JSON.parse(item.lote);
      if (Array.isArray(parsed)) {
        const validades = parsed
          .map((lp) => {
            const val = lp.data_vencimento || lp.validade || lp.data_validade;
            if (!val) return null;
            try {
              const d = new Date(val);
              if (!isNaN(d.getTime())) return d.toLocaleDateString("pt-BR");
            } catch (e) {}
            return val;
          })
          .filter(Boolean);
        if (validades.length > 0) return [...new Set(validades)].join(", ");
      } else if (parsed && typeof parsed === "object") {
        const val = parsed.data_vencimento || parsed.validade || parsed.data_validade;
        if (val) {
          try {
            const d = new Date(val);
            if (!isNaN(d.getTime())) return d.toLocaleDateString("pt-BR");
          } catch (e) {}
          return val;
        }
      }
    } catch (e) {
      // Caso a data esteja em formato de texto dentro de item.lote, ex: (Validade: DD/MM/AAAA)
      const match = item.lote.match(/[Vv]alidade:\s*([0-9\/\-]+)/);
      if (match && match[1]) return match[1];
    }
  }
  return "-";
};

const calcularQtdDevolvida = (mov, item) => {
  if (item && item.quantidade_devolvida !== undefined && item.quantidade_devolvida !== null) {
    const val = Number(item.quantidade_devolvida);
    if (val > 0) return val;
  }
  const itemId = typeof item === "object" ? item.id : item;
  if (!mov?.devolucoes || mov.devolucoes.length === 0) return 0;
  let total = 0;
  for (let d of mov.devolucoes) {
    if (d.item_movimentacao_id === itemId) {
      total += Number(d.quantidade);
    }
  }
  return total;
};

const getStatusLabel = (status) => {
  const labels = {
    P: "Aguardando Análise",
    A: "Atendido",
    R: "Negado",
    C: "Rascunho",
    X: "Cancelado",
  };
  return labels[status] || status;
};

const getStatusVariant = (status) => {
  const variants = {
    P: "secondary",
    A: "default",
    R: "destructive",
    C: "outline",
    X: "destructive",
  };
  return variants[status] || "secondary";
};

const toggleExpand = (pedidoId) => {
  expanded.value[pedidoId] = !expanded.value[pedidoId];
};

const fetchPedidos = async () => {
  loading.value = true;
  try {
    const token = localStorage.getItem("token");
    const rawSetorId = store.state.estoque.setorAtualId || store.state.estoque.setorDetails?.id || (setorCookie?.getSectorId ? setorCookie.getSectorId() : null);

    if (!rawSetorId) {
      pedidos.value = [];
      loading.value = false;
      return;
    }

    const sid = Number(rawSetorId);

    const response = await axios.post(
      "/movimentacao/listBySetor",
      { setor_id: sid, per_page: 5000, lote: searchLote.value },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.status) {
      const data = response.data.data?.data || response.data.data || [];
      const currentUserId = store.state.auth.user?.id;
      pedidos.value = data.filter((mov) => {
        const destId = Number(mov.setor_destino_id ?? mov.setorDestino?.id);
        const origId = Number(mov.setor_origem_id ?? mov.setorOrigem?.id);
        const isUserReq = currentUserId && Number(mov.usuario_id) === Number(currentUserId);
        return (
          ((mov.tipo === "S" || mov.tipo === "T") && destId === sid) ||
          (mov.tipo === "D" && origId === sid) ||
          (isUserReq && (destId === sid || !destId))
        );
      });
    }
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    toast({
      title: "Erro",
      description: "Não foi possível carregar o histórico.",
      variant: "destructive",
    });
  } finally {
    loading.value = false;
  }
};

watch(
  () => [store.state.estoque.setorAtualId, store.state.estoque.setorDetails?.id],
  () => {
    fetchPedidos();
  }
);

// Abre modal de devolução no nível do pedido
const abrirModalDevolucao = (pedido) => {
  pedidoParaDevolver.value = pedido;
};

const editarPedido = (pedido) => {
  carregarPedidoParaEdicao(pedido);
  toast({
    title: "Modo de edição",
    description: `Pedido #${pedido.id} carregado para edição.`,
  });
  router.replace({ query: { tab: "pedido" } });
};

const {
  enviarParaAnalise,
  cancelarPedido,
  excluirRascunho,
  actionInProgress,
  isLoadingAcao,
} = usePedidosStateMachine(fetchPedidos);

const abrirCancelarPedido = (pedido) => {
  pedidoSelecionado.value = pedido;
  showCancelDialog.value = true;
};

const confirmarCancelamento = async () => {
  const pedido = pedidoSelecionado.value;
  if (!pedido) return;

  showCancelDialog.value = false;
  await cancelarPedido(pedido);
  pedidoSelecionado.value = null;
};

const abrirExcluirRascunho = (pedido) => {
  pedidoSelecionado.value = pedido;
  showDeleteDialog.value = true;
};

const confirmarExclusaoRascunho = async () => {
  const pedido = pedidoSelecionado.value;
  if (!pedido) return;

  showDeleteDialog.value = false;
  await excluirRascunho(pedido);
  pedidoSelecionado.value = null;
};

const imprimirPedido = (pedido) => {
  if (!gerarImpressaoPedido(pedido)) {
    toast({
      title: "Erro",
      description:
        "Não foi possível abrir a janela de impressão. Verifique se pop-ups estão bloqueados.",
      variant: "destructive",
    });
  }
};

const exportarExcel = async (pedido) => {
  if (!(await exportarPedidoExcel(pedido))) {
    toast({
      title: "Erro",
      description: "Não foi possível gerar a planilha do pedido.",
      variant: "destructive",
    });
  }
};

const exportarTodosExcel = async () => {
  const gerou = await exportarPedidosExcel(pedidos.value, {
    nomeArquivo: "meus_pedidos",
    titulo: "Meus Pedidos",
  });

  if (!gerou) {
    toast({
      title: "Nada para exportar",
      description: "Não há pedidos na lista para gerar a planilha.",
    });
  }
};

const irParaBuscar = () => {
  router.replace({ query: { tab: "itens" } });
};

onMounted(() => {
  fetchPedidos();
});
</script>
