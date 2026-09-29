<template>
  <div class="p-3 border rounded bg-white mt-2">
    <h6 class="mb-2 text-primary font-semibold text-sm">Cadastrar grupo de produto</h6>
    <div class="row g-3 align-items-end">
      <div class="col-md-6">
        <Label class="text-sm" for="novoGrupoProdutoNome">
          Nome do grupo
          <span class="text-danger">*</span>
        </Label>
        <Input
          id="novoGrupoProdutoNome"
          v-model="form.nome"
          type="text"
          class="text-uppercase"
          placeholder="Ex: ANALGÉSICOS"
        />
      </div>

      <div class="col-md-3">
        <Label class="text-sm" for="novoGrupoProdutoTipo">Tipo</Label>
        <Select v-model="form.tipo">
          <SelectTrigger id="novoGrupoProdutoTipo" class="w-full">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Material">Material</SelectItem>
            <SelectItem value="Medicamento">Medicamento</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="col-md-3 d-flex justify-content-end gap-2">
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
          :disabled="salvando || !form.nome"
        >
          <template v-if="!salvando">
            <i class="mdi mdi-check me-1"></i>
            <span>Salvar grupo</span>
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

export default {
  name: "ModalQuickAddGrupoProduto",
  components: {
    Button,
    Input,
    Label,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  },
  emits: ["created", "cancel"],
  data() {
    return {
      salvando: false,
      form: {
        nome: "",
        tipo: "Material",
      },
    };
  },
  methods: {
    cancelar() {
      this.reset();
      this.$emit("cancel");
    },
    reset() {
      this.form = {
        nome: "",
        tipo: "Material",
      };
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
      console.log(`[ModalQuickAddGrupoProduto] ${mensagem}`);
    },
    async salvar() {
      if (this.salvando) return;

      if (!this.form.nome) {
        this.notificar("Informe o nome do grupo", "error");
        return;
      }

      const payload = {
        grupoProduto: {
          nome: this.form.nome,
          tipo: this.form.tipo || "Material",
          status: "A",
        },
      };

      this.salvando = true;

      try {
        const response = await this.$axios.post("/grupoProduto/add", payload, {
          headers: {
            Authorization: "Bearer " + this.$store.getters["auth/getUserToken"],
            "Content-Type": "application/json",
          },
        });

        if (response.data?.status && response.data.data?.id) {
          const grupo = response.data.data;
          this.notificar("Grupo de produto cadastrado com sucesso", "success");
          this.$emit("created", grupo);
          this.reset();
        } else {
          const mensagem =
            response.data?.message ||
            "Não foi possível cadastrar o grupo. Tente novamente.";
          this.notificar(mensagem, "error");
        }
      } catch (error) {
        const mensagem =
          error.response?.data?.message ||
          "Erro ao cadastrar grupo de produto. Verifique os dados e tente novamente.";
        this.notificar(mensagem, "error");
        console.error("Erro ao cadastrar grupo de produto inline", error);
      } finally {
        this.salvando = false;
      }
    },
  },
};
</script>
