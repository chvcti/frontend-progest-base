<template>
  <div class="mt-3 mb-4 p-3 border rounded bg-light">
    <h6 class="mb-3 text-primary font-semibold">Cadastrar produto rapidamente</h6>
    <div class="row g-3">
      <div class="col-lg-4 col-md-6">
        <Label for="novoProdutoNome">
          Nome do produto
          <span class="text-danger">*</span>
        </Label>
        <Input
          id="novoProdutoNome"
          v-model="form.nome"
          type="text"
          class="text-uppercase"
          placeholder="Ex: DIPIRONA 500MG"
        />
      </div>

      <div class="col-lg-4 col-md-6">
        <Label for="novoProdutoGrupo">Grupo do produto</Label>
        <div class="flex gap-2">
          <div class="flex-1">
            <Select v-model="form.grupo_produto_id">
              <SelectTrigger id="novoProdutoGrupo">
                <SelectValue placeholder="Selecionar grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="grupo in todosGrupos"
                  :key="grupo.id"
                  :value="String(grupo.id)"
                >
                  {{ grupo.nome }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="icon"
            type="button"
            @click="showGrupoForm = !showGrupoForm"
            title="Cadastrar novo grupo"
          >
            <i class="mdi mdi-plus"></i>
          </Button>
        </div>
      </div>

      <div class="col-lg-4 col-md-6">
        <Label for="novoProdutoUnidade">
          Unidade de medida
          <span class="text-danger">*</span>
        </Label>
        <div class="flex gap-2">
          <div class="flex-1">
            <Select v-model="form.unidade_medida_id">
              <SelectTrigger id="novoProdutoUnidade" class="w-full">
                <SelectValue placeholder="Selecionar unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="unidade in todasUnidades"
                  :key="unidade.id"
                  :value="String(unidade.id)"
                >
                  {{ unidade.nome }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="icon"
            type="button"
            @click="showUnidadeForm = !showUnidadeForm"
            title="Cadastrar nova unidade"
          >
            <i class="mdi mdi-plus"></i>
          </Button>
        </div>
      </div>

      <div class="col-md-3">
        <Label for="novoProdutoStatus">Status</Label>
        <Select v-model="form.status">
          <SelectTrigger id="novoProdutoStatus" class="w-full">
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="A">Ativo</SelectItem>
            <SelectItem value="I">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="col-md-3">
        <Label for="novoProdutoCodigoSimpas">Código SIMPAS</Label>
        <Input
          id="novoProdutoCodigoSimpas"
          v-model="form.codigo_simpas"
          type="text"
          class="text-uppercase"
          placeholder="Ex: ABC-123.45"
        />
      </div>

      <div class="col-md-3">
        <Label for="novoProdutoCodigoBarras">Código de barras</Label>
        <Input
          id="novoProdutoCodigoBarras"
          v-model="form.codigo_barras"
          type="text"
          placeholder="Ex: 7891234567890"
        />
      </div>

      <div class="col-md-3">
        <Label for="novoProdutoMarca">Marca</Label>
        <Input
          id="novoProdutoMarca"
          v-model="form.marca"
          type="text"
          class="text-uppercase"
          placeholder="Ex: EMS"
        />
      </div>

      <!-- Sub-CRUD Inline: Grupo de Produto -->
      <div v-if="showGrupoForm" class="col-12">
        <ModalQuickAddGrupoProduto
          @created="onGrupoCreated"
          @cancel="showGrupoForm = false"
        />
      </div>

      <!-- Sub-CRUD Inline: Unidade de Medida -->
      <div v-if="showUnidadeForm" class="col-12">
        <ModalQuickAddUnidadeMedida
          @created="onUnidadeCreated"
          @cancel="showUnidadeForm = false"
        />
      </div>

      <div class="col-12 d-flex justify-content-end gap-2">
        <Button
          variant="secondary"
          size="sm"
          type="button"
          @click="cancelar"
          :disabled="salvando"
        >
          <i class="mdi mdi-close me-1"></i>
          Cancelar
        </Button>
        <Button
          variant="default"
          size="sm"
          type="button"
          @click="salvar"
          :disabled="salvando || !form.nome || !form.unidade_medida_id"
        >
          <template v-if="!salvando">
            <i class="mdi mdi-check me-1"></i>
            <span>Salvar produto</span>
          </template>
          <template v-else>
            <span
              class="spinner-border spinner-border-sm me-1"
              role="status"
              aria-hidden="true"
            ></span>
            <span>Salvando...</span>
          </template>
        </Button>
      </div>
    </div>
  </div>
</template>

<script>
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ModalQuickAddGrupoProduto from "@/components/shared/ModalQuickAddGrupoProduto.vue";
import ModalQuickAddUnidadeMedida from "@/components/shared/ModalQuickAddUnidadeMedida.vue";

export default {
  name: "ModalQuickAddProduto",
  components: {
    Button,
    Input,
    Label,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    ModalQuickAddGrupoProduto,
    ModalQuickAddUnidadeMedida,
  },
  props: {
    gruposDisponiveis: {
      type: Array,
      default: () => [],
    },
    unidadesDisponiveis: {
      type: Array,
      default: () => [],
    },
  },
  emits: ["created", "cancel"],
  data() {
    return {
      salvando: false,
      showGrupoForm: false,
      showUnidadeForm: false,
      gruposLocais: [],
      unidadesLocais: [],
      form: {
        nome: "",
        unidade_medida_id: "",
        status: "A",
        grupo_produto_id: "",
        codigo_simpas: "",
        marca: "",
        codigo_barras: "",
      },
    };
  },
  computed: {
    todosGrupos() {
      const base = Array.isArray(this.gruposDisponiveis) ? this.gruposDisponiveis : [];
      const novos = this.gruposLocais.filter((g) => !base.some((b) => b.id === g.id));
      return [...base, ...novos];
    },
    todasUnidades() {
      const base = Array.isArray(this.unidadesDisponiveis) ? this.unidadesDisponiveis : [];
      const novas = this.unidadesLocais.filter((u) => !base.some((b) => b.id === u.id));
      return [...base, ...novas];
    },
  },
  methods: {
    cancelar() {
      this.reset();
      this.$emit("cancel");
    },
    reset() {
      this.form = {
        nome: "",
        unidade_medida_id: "",
        status: "A",
        grupo_produto_id: "",
        codigo_simpas: "",
        marca: "",
        codigo_barras: "",
      };
      this.showGrupoForm = false;
      this.showUnidadeForm = false;
      this.salvando = false;
    },
    notificar(mensagem, tipo = "info") {
      if (this.$toastr) {
        const fn = this.$toastr[tipo] || this.$toastr.i || this.$toastr.s;
        if (typeof fn === "function") {
          fn.call(this.$toastr, mensagem);
          return;
        }
      }
      console.log(`[ModalQuickAddProduto] ${mensagem}`);
    },
    onGrupoCreated(grupo) {
      if (grupo && grupo.id) {
        this.gruposLocais.push(grupo);
        this.form.grupo_produto_id = String(grupo.id);
      }
      this.showGrupoForm = false;
    },
    onUnidadeCreated(unidade) {
      if (unidade && unidade.id) {
        this.unidadesLocais.push(unidade);
        this.form.unidade_medida_id = String(unidade.id);
      }
      this.showUnidadeForm = false;
    },
    async salvar() {
      if (this.salvando) return;

      if (!this.form.nome) {
        this.notificar("Informe o nome do produto", "error");
        return;
      }

      if (!this.form.unidade_medida_id) {
        this.notificar("Selecione uma unidade de medida", "error");
        return;
      }

      const payload = {
        produto: {
          nome: this.form.nome,
          unidade_medida_id: this.form.unidade_medida_id,
          status: this.form.status || "A",
          grupo_produto_id: this.form.grupo_produto_id || null,
          codigo_simpas: this.form.codigo_simpas || "",
          codigo_barras: this.form.codigo_barras || "",
          marca: this.form.marca || "",
        },
      };

      this.salvando = true;

      try {
        const response = await this.$axios.post("/produtos/add", payload, {
          headers: {
            Authorization: "Bearer " + this.$store.getters["auth/getUserToken"],
            "Content-Type": "application/json",
          },
        });

        if (response.data?.status && response.data.data?.id) {
          const produto = response.data.data;
          this.notificar("Produto cadastrado com sucesso", "success");
          this.$emit("created", produto);
          this.reset();
        } else {
          const mensagem =
            response.data?.message ||
            "Não foi possível cadastrar o produto. Tente novamente.";
          this.notificar(mensagem, "error");
        }
      } catch (error) {
        const mensagem =
          error.response?.data?.message ||
          "Erro ao cadastrar produto. Verifique os dados e tente novamente.";
        this.notificar(mensagem, "error");
        console.error("Erro ao cadastrar produto inline", error);
      } finally {
        this.salvando = false;
      }
    },
  },
};
</script>
