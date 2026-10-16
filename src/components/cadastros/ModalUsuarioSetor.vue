<script setup>
import { ref, watch, computed, inject, nextTick } from "vue";
import { useStore } from "vuex";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { onClickOutside } from "@vueuse/core";
import {
  UserPlusIcon,
  ShieldCheckIcon,
  UserCogIcon,
  CheckIcon,
  AlertCircleIcon,
  SearchIcon,
  ChevronDownIcon,
  XIcon,
} from "lucide-vue-next";
import Funcoes from "@/functions/cad_usuario_setor.js";
import functionsSetor from "@/functions/cad_setores.js";

const props = defineProps({
  setorId: { type: [Number, String], required: true },
  mode: { type: String, default: "ADD" },
  initialData: { type: Object, default: () => ({}) },
});

const emit = defineEmits(["changed"]);

const store = useStore();
const isOpen = ref(false);
const loading = ref(false);
const availableUsers = ref([]);
const setorLocal = ref(null);
const form = ref({
  usuario_id: "",
  perfil: "solicitante",
});

const parentContext = inject("setorAtualContext", {
  $axios: null,
  $store: null,
  $toastr: undefined,
});

const openModal = () => {
  isOpen.value = true;
};

const closeModal = () => {
  isOpen.value = false;
};

defineExpose({ openModal, closeModal });

const currentSetor = computed(() => {
  if (setorLocal.value && Number(setorLocal.value.id) === Number(props.setorId)) {
    return setorLocal.value;
  }
  const sStore = store || parentContext.$store;
  const details = sStore?.state?.estoque?.setorDetails || sStore?.state?.setorDetails || parentContext?.setor?.value;
  if (details && (Number(details.id) === Number(props.setorId) || !props.setorId)) {
    return details;
  }
  // Fallback: verificar se existe na lista geral de setores do store
  const listGerais = sStore?.state?.cadastros?.listSetoresGerais;
  const setoresList = Array.isArray(listGerais?.data) ? listGerais.data : Array.isArray(listGerais) ? listGerais : [];
  const found = setoresList.find((s) => Number(s.id) === Number(props.setorId));
  if (found) return found;

  return setorLocal.value || details || null;
});

const hasEstoque = computed(() => {
  const s = currentSetor.value;
  return s ? Boolean(s.estoque && s.estoque !== "0" && s.estoque !== 0) : false;
});

const isCentralOuCAF = computed(() => {
  const s = currentSetor.value;
  if (!s) return false;
  // É central (CAF) se possui controle de estoque ativo e não tem fornecedor/distribuidor vinculado
  return !!s.estoque && !(s.setor_fornecedor_id || s.setor_fornecedor || (s.distribuidores_relacionados && s.distribuidores_relacionados.length > 0));
});

const isRoleDisabled = (role) => {
  if (role === 'almoxarife' && !hasEstoque.value) return true;
  if (role === 'solicitante' && isCentralOuCAF.value) return true;
  return false;
};

const getRoleErrorMsg = (role) => {
  if (role === 'almoxarife' && !hasEstoque.value) return "Não permitido: Este setor não possui controle de estoque.";
  if (role === 'solicitante' && isCentralOuCAF.value) return "Não permitido: Setores centrais/CAF não possuem solicitantes.";
  return "";
};

/* --- Seleção de colaborador com busca --- */
const userSearch = ref("");
const isUserListOpen = ref(false);
const userPickerRef = ref(null);
const searchInputRef = ref(null);

// Remove acentos para que "jose" encontre "JOSÉ"
const normalize = (valor) =>
  String(valor ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const filteredUsers = computed(() => {
  const termo = normalize(userSearch.value).trim();
  if (!termo) return availableUsers.value;
  return availableUsers.value.filter((u) =>
    [u.name, u.email, u.cpf].some((campo) => normalize(campo).includes(termo)),
  );
});

const selectedUserName = computed(() => {
  const encontrado = availableUsers.value.find(
    (u) => String(u.id) === String(form.value.usuario_id),
  );
  return encontrado ? encontrado.name : "";
});

const toggleUserList = async () => {
  isUserListOpen.value = !isUserListOpen.value;
  if (!isUserListOpen.value) return;
  await nextTick();
  const el = searchInputRef.value?.$el ?? searchInputRef.value;
  el?.focus?.();
};

const selectUser = (usuario) => {
  form.value.usuario_id = String(usuario.id);
  userSearch.value = "";
  isUserListOpen.value = false;
};

onClickOutside(userPickerRef, () => {
  isUserListOpen.value = false;
});

const loadData = async () => {
  const context = {
    $axios: parentContext.$axios,
    $store: parentContext.$store || store,
    $toastr: parentContext.$toastr,
  };

  try {
    if (props.setorId) {
      const sStore = store || parentContext.$store;
      const details = sStore?.state?.estoque?.setorDetails || parentContext?.setor?.value;
      if (details && Number(details.id) === Number(props.setorId)) {
        setorLocal.value = details;
      } else {
        const res = await functionsSetor.buscarSetorPorId(props.setorId);
        if (res?.success && res.data) {
          setorLocal.value = res.data;
        }
      }
    }

    const linked = await Funcoes.listBySetor(context, props.setorId);
    const all = await Funcoes.listAllUsers(context);

    const linkedIds = new Set((linked || []).map((u) => u.id));
    availableUsers.value = (all || []).filter((u) => !linkedIds.has(u.id));
  } catch (err) {
    console.error("Erro ao carregar dados do modal:", err);
  }
};

watch(isOpen, async (newVal) => {
  userSearch.value = "";
  isUserListOpen.value = false;

  if (newVal) {
    await loadData();
    if (props.mode === "UP" && props.initialData) {
      form.value.usuario_id = props.initialData.usuario_id;
      form.value.perfil = props.initialData.perfil || "solicitante";
    } else {
      // Definir perfil padrão ao abrir no modo ADD
      const defaultRole = isRoleDisabled("solicitante")
        ? (hasEstoque.value ? "almoxarife" : "admin")
        : "solicitante";
      form.value = { usuario_id: "", perfil: defaultRole };
    }
  } else {
    form.value = { usuario_id: "", perfil: "solicitante" };
  }
});

const submit = async () => {
  const context = {
    $axios: parentContext.$axios,
    $store: parentContext.$store,
    $toastr: parentContext.$toastr,
  };

  loading.value = true;
  
  if (isRoleDisabled(form.value.perfil)) {
    if (context.$toastr) context.$toastr.e(getRoleErrorMsg(form.value.perfil));
    loading.value = false;
    return;
  }

  try {
    const payload = {
      usuario_id: form.value.usuario_id || props.initialData.usuario_id,
      setor_id: props.setorId,
      perfil: form.value.perfil,
    };

    let resp;
    if (props.mode === "ADD") {
      if (!form.value.usuario_id) {
        if (context.$toastr) context.$toastr.error("Selecione um usuário.");
        loading.value = false;
        return;
      }
      resp = await Funcoes.create(context, payload);
    } else {
      resp = await Funcoes.update(context, payload);
    }

    if (resp && resp.status) {
      if (context.$toastr)
        context.$toastr.success(
          props.mode === "ADD" ? "Usuário vinculado!" : "Perfil atualizado!",
        );
      closeModal();
      emit("changed");
    } else {
      if (context.$toastr)
        context.$toastr.error(resp?.message || "Erro na operação.");
    }
  } catch (err) {
    console.error(err);
    if (context.$toastr)
      context.$toastr.error("Falha ao processar solicitação.");
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <Dialog v-model:open="isOpen">
    <DialogContent
      class="sm:max-w-[450px] p-0 overflow-hidden border-none shadow-2xl rounded-[2rem]"
    >
      <DialogHeader class="p-8 bg-slate-50 border-b border-slate-100 relative">
        <div class="absolute top-0 right-0 p-8 opacity-[0.03]">
          <UserCogIcon class="w-24 h-24" />
        </div>

        <div class="flex items-center gap-4 relative z-10">
          <div class="p-3 bg-primary/10 rounded-2xl text-primary">
            <UserPlusIcon v-if="mode === 'ADD'" class="w-6 h-6" />
            <ShieldCheckIcon v-else class="w-6 h-6" />
          </div>
          <div>
            <DialogTitle
              class="text-xl font-black text-slate-900 tracking-tight"
            >
              {{ mode === "ADD" ? "Vincular Usuário" : "Ajustar Permissões" }}
            </DialogTitle>
            <DialogDescription class="text-slate-500 font-medium">
              {{
                mode === "ADD"
                  ? "Selecione um colaborador para este setor."
                  : "Modifique o nível de acesso do usuário."
              }}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div class="p-8 space-y-6">
        <!-- User Selection (ADD ONLY) -->
        <div v-if="mode === 'ADD'" class="space-y-3">
          <Label
            class="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1"
            >Colaborador Disponível</Label
          >
          <div ref="userPickerRef" class="relative">
            <!-- Gatilho -->
            <button
              type="button"
              @click="toggleUserList"
              class="flex h-12 w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/30 px-3 text-sm transition-colors hover:bg-slate-50"
            >
              <span
                :class="
                  selectedUserName
                    ? 'font-bold text-slate-800'
                    : 'text-slate-400'
                "
              >
                {{ selectedUserName || "Busque um usuário..." }}
              </span>
              <ChevronDownIcon
                class="h-4 w-4 shrink-0 text-slate-400 transition-transform"
                :class="{ 'rotate-180': isUserListOpen }"
              />
            </button>

            <!-- Lista com busca -->
            <div
              v-if="isUserListOpen"
              class="absolute z-[2500] mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
            >
              <div class="border-b border-slate-100 p-2">
                <div
                  class="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 transition-colors focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20"
                >
                  <SearchIcon class="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    ref="searchInputRef"
                    v-model="userSearch"
                    type="text"
                    autocomplete="off"
                    spellcheck="false"
                    placeholder="Nome, e-mail ou CPF..."
                    class="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                    @keydown.esc="isUserListOpen = false"
                  />
                  <button
                    v-if="userSearch"
                    type="button"
                    aria-label="Limpar busca"
                    class="shrink-0 text-slate-300 transition-colors hover:text-slate-500"
                    @click="userSearch = ''"
                  >
                    <XIcon class="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div class="max-h-48 overflow-y-auto">
                <button
                  v-for="u in filteredUsers"
                  :key="u.id"
                  type="button"
                  @click="selectUser(u)"
                  class="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left transition-colors hover:bg-slate-50"
                  :class="{
                    'bg-primary/5': String(u.id) === String(form.usuario_id),
                  }"
                >
                  <span class="font-bold text-slate-800">{{ u.name }}</span>
                  <span v-if="u.email" class="text-xs text-slate-400">{{
                    u.email
                  }}</span>
                </button>

                <div
                  v-if="filteredUsers.length === 0"
                  class="flex flex-col items-center px-4 py-6 text-center"
                >
                  <AlertCircleIcon class="mb-2 h-6 w-6 text-slate-300" />
                  <span class="text-xs font-medium text-slate-400">
                    {{
                      availableUsers.length === 0
                        ? "Todos os usuários já estão vinculados."
                        : `Nenhum usuário encontrado para "${userSearch}".`
                    }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Role Selection -->
        <div class="space-y-3">
          <Label
            class="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1"
            >Nível de Acesso (Perfil)</Label
          >
          <div class="grid grid-cols-1 gap-2">
            <button
              v-for="role in ['admin', 'almoxarife', 'solicitante']"
              :key="role"
              type="button"
              :disabled="isRoleDisabled(role)"
              @click="form.perfil = role"
              :class="[
                'flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 text-start',
                isRoleDisabled(role)
                  ? 'opacity-50 cursor-not-allowed border-slate-100 bg-slate-50'
                  : form.perfil === role
                    ? 'border-primary bg-primary/5 ring-4 ring-primary/10'
                    : 'border-slate-100 hover:border-slate-200 bg-white',
              ]"
            >
              <div class="flex flex-col">
                <span
                  class="text-xs font-black uppercase tracking-widest"
                  :class="isRoleDisabled(role) ? 'text-slate-400 line-through' : 'text-slate-900'"
                  >{{ role }}</span
                >
                <span 
                  v-if="!isRoleDisabled(role)"
                  class="text-[10px] text-slate-500 font-medium mt-0.5"
                >
                  {{
                    role === "admin"
                      ? "Controle total do setor"
                      : role === "almoxarife"
                        ? "Gestão de estoque e entradas"
                        : "Apenas requisições de itens"
                  }}
                </span>
                <span 
                  v-else
                  class="text-[10px] text-destructive font-bold mt-0.5"
                >
                  {{ getRoleErrorMsg(role) }}
                </span>
              </div>
              <div
                v-if="form.perfil === role"
                class="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white"
              >
                <CheckIcon class="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>
      </div>

      <DialogFooter
        class="px-8 pb-8 pt-2 flex flex-col-reverse sm:flex-row gap-3"
      >
        <Button
          variant="ghost"
          @click="closeModal"
          class="flex-1 h-12 rounded-xl font-bold text-slate-400 hover:text-slate-600"
        >
          Descartar
        </Button>
        <Button
          @click="submit"
          :disabled="loading"
          class="flex-1 h-12 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20"
        >
          {{ mode === "ADD" ? "Vincular Agora" : "Salvar Alterações" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
