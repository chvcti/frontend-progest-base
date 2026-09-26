<template>
  <Dialog :open="dialogOpen" @update:open="fecharModal">
    <DialogContent class="sm:max-w-[700px]">
      <DialogHeader>
        <DialogTitle class="text-amber-800 flex items-center gap-2">
          <i class="mdi mdi-keyboard-return text-xl"></i>
          Devolução do Pedido #{{ movimentacao?.id }}
        </DialogTitle>
        <DialogDescription>
          Preencha a quantidade que deseja devolver para cada item deste pedido. Itens com quantidade 0 não serão devolvidos.
        </DialogDescription>
      </DialogHeader>

      <div class="py-4">
        <div v-if="!movimentacao" class="text-center text-slate-500 py-4">
          Carregando dados...
        </div>
        <div v-else class="space-y-4">
          <div class="border rounded-md overflow-hidden">
            <table class="w-full text-sm text-left text-slate-600">
              <thead class="text-xs text-slate-700 uppercase bg-slate-50">
                <tr>
                  <th scope="col" class="px-4 py-3">Produto</th>
                  <th scope="col" class="px-4 py-3 text-center">Lote</th>
                  <th scope="col" class="px-4 py-3 text-center">Liberado</th>
                  <th scope="col" class="px-4 py-3 text-center">Saldo Devolvível</th>
                  <th scope="col" class="px-4 py-3 text-center w-32">A Devolver</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in itensParaDevolver" :key="item.item_movimentacao_id" class="border-b last:border-0 hover:bg-slate-50/50">
                  <td class="px-4 py-3 font-medium text-slate-900">
                    {{ item.nome }}
                  </td>
                  <td class="px-4 py-3 text-center text-xs text-slate-500 font-mono font-medium">
                    {{ formatarLote(item.loteStr, item.lotesParsed) }}
                  </td>
                  <td class="px-4 py-3 text-center font-bold text-slate-700">
                    {{ item.quantidade_liberada }}
                  </td>
                  <td class="px-4 py-3 text-center font-bold" :class="item.saldo_devoluvel > 0 ? 'text-emerald-600' : 'text-slate-400'">
                    <span v-if="item.saldo_devoluvel > 0">{{ item.saldo_devoluvel }}</span>
                    <span v-else class="text-xs text-slate-400 italic">Totalmente devolvido</span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <Input
                      type="number"
                      step="1"
                      min="0"
                      :max="item.saldo_devoluvel"
                      v-model.number="item.quantidade_devolvendo"
                      @keydown="(e) => ['e', 'E', '+', '-', '.', ','].includes(e.key) && e.preventDefault()"
                      class="h-8 text-center w-auto min-w-[5rem] px-2 mx-auto"
                      :class="{'border-red-500 text-red-600': item.quantidade_devolvendo > item.saldo_devoluvel || item.quantidade_devolvendo < 0}"
                      :disabled="item.saldo_devoluvel <= 0"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium">Motivo / Observação (Opcional)</label>
            <Textarea
              v-model="motivo"
              placeholder="Explique o motivo da devolução..."
              rows="2"
            />
          </div>
        </div>

        <div v-if="erroExcede" class="mt-3 text-sm text-red-600 font-medium">
          <i class="mdi mdi-alert-circle mr-1"></i> A quantidade a devolver não pode superar o saldo atendido disponível.
        </div>
        <div v-if="erroZero" class="mt-3 text-sm text-amber-600 font-medium">
          <i class="mdi mdi-alert-circle mr-1"></i> Preencha a quantidade de pelo menos um item para devolução.
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="fecharModal" :disabled="loading">
          Cancelar
        </Button>
        <Button 
          @click="confirmarDevolucao" 
          :disabled="loading || erroExcede || erroZero"
          class="bg-amber-600 hover:bg-amber-700 text-white"
        >
          <span v-if="loading" class="mdi mdi-loading mdi-spin mr-2"></span>
          Enviar Solicitação
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import cadMovimentacao from "@/functions/cad_movimentacao.js";
import { useToast } from "@/components/ui/toast/use-toast";
import { useStore } from "vuex";
import axios from "axios";

const props = defineProps({
  movimentacao: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(["sucesso", "update:open"]);
const { toast } = useToast();
const store = useStore();

const dialogOpen = ref(false);
const loading = ref(false);
const motivo = ref("");
const itensParaDevolver = ref([]);

const calcularTotalJaDevolvido = (mov, item) => {
  if (item.quantidade_devolvida !== undefined && item.quantidade_devolvida !== null) {
    return Number(item.quantidade_devolvida) || 0;
  }
  if (mov && Array.isArray(mov.devolucoes)) {
    return mov.devolucoes
      .filter((d) => d.item_movimentacao_id === item.id)
      .reduce((acc, d) => acc + (Number(d.quantidade) || 0), 0);
  }
  return 0;
};

watch(() => props.movimentacao, (newMov) => {
  if (newMov) {
    dialogOpen.value = true;
    motivo.value = "";
    itensParaDevolver.value = (newMov.itens || []).map(item => {
      const qtdLiberada = Number(item.quantidade_liberada) || 0;
      const totalDevolvido = calcularTotalJaDevolvido(newMov, item);
      const saldoDevoluvel = Math.max(0, qtdLiberada - totalDevolvido);
      return {
        item_movimentacao_id: item.id,
        nome: item.produto?.nome || `Produto #${item.produto_id}`,
        loteStr: item.numero_lote || item.lote,
        lotesParsed: item.lotes_parsed,
        quantidade_liberada: qtdLiberada,
        total_devolvido: totalDevolvido,
        saldo_devoluvel: saldoDevoluvel,
        quantidade_devolvendo: 0
      };
    });
  } else {
    dialogOpen.value = false;
  }
}, { immediate: true });

const fecharModal = () => {
  dialogOpen.value = false;
  emit("update:open", false);
};

const erroExcede = computed(() => {
  return itensParaDevolver.value.some(
    item => Number(item.quantidade_devolvendo) > item.saldo_devoluvel || Number(item.quantidade_devolvendo) < 0
  );
});

const erroZero = computed(() => {
  return itensParaDevolver.value.every(item => (Number(item.quantidade_devolvendo) || 0) <= 0);
});

const limparStringLote = (str) => {
  if (!str) return "";
  let res = String(str).trim();
  res = res.replace(/\s*\([Vv]alidade:?[^)]*\)/g, "");
  res = res.replace(/\s*-\s*[Vv]alidade:?.*$/i, "");
  res = res.replace(/^[Ll]ote:\s*/i, "");
  return res.trim();
};

const formatarLote = (loteStr, lotesParsed) => {
  if (Array.isArray(lotesParsed) && lotesParsed.length > 0) {
    return lotesParsed.map((l) => limparStringLote(l.numero_lote || l.lote)).filter(Boolean).join(", ") || "—";
  }
  if (!loteStr) return "—";
  if (typeof loteStr === "object") {
    return Array.isArray(loteStr)
      ? loteStr.map((l) => limparStringLote(l.numero_lote || l.lote)).filter(Boolean).join(", ")
      : (limparStringLote(loteStr.numero_lote || loteStr.lote) || "—");
  }
  try {
    const lotes = JSON.parse(loteStr);
    if (Array.isArray(lotes)) {
      return lotes.map((l) => limparStringLote(l.numero_lote || l.lote)).filter(Boolean).join(", ") || "—";
    }
  } catch (e) {
    // string simples de lote
  }
  return limparStringLote(loteStr) || "—";
};

const confirmarDevolucao = async () => {
  if (erroExcede.value || erroZero.value) return;

  loading.value = true;
  try {
    const payload = {
      motivo: motivo.value,
      itens: itensParaDevolver.value.map(item => ({
        item_movimentacao_id: item.item_movimentacao_id,
        quantidade_devolvendo: Math.max(0, Math.floor(Number(item.quantidade_devolvendo) || 0))
      }))
    };
    
    const content = {
      $axios: axios,
      $store: store,
      $toastr: {
        s: (msg) => toast({ title: "Sucesso", description: msg }),
        e: (msg) => toast({ title: "Erro", description: msg, variant: "destructive" })
      }
    };
    
    await cadMovimentacao.devolverPedido(content, props.movimentacao.id, payload);
    emit("sucesso");
    fecharModal();
  } catch (error) {
    console.error("Erro ao solicitar devolução", error);
  } finally {
    loading.value = false;
  }
};
</script>
