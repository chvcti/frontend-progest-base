<template>
  <div class="p-3 border rounded bg-white mt-2">
    <h6 class="mb-2 text-primary font-semibold text-sm">Cadastrar unidade de medida</h6>
    <div class="row g-3 align-items-end">
      <div class="col-md-4">
        <Label class="text-sm" for="novaUnidadeMedidaNome">
          Nome da unidade
          <span class="text-danger">*</span>
        </Label>
        <Input
          id="novaUnidadeMedidaNome"
          v-model="form.nome"
          type="text"
          class="text-uppercase"
          placeholder="Ex: CAIXA"
        />
      </div>

      <div class="col-md-3">
        <Label class="text-sm" for="novaUnidadeMedidaQtd">
          Qtd. Mínima
          <span class="text-danger">*</span>
        </Label>
        <Input
          id="novaUnidadeMedidaQtd"
          v-model="form.quantidade_unidade_minima"
          type="number"
          step="0.01"
          placeholder="Ex: 1"
        />
      </div>

      <div class="col-md-5 d-flex justify-content-end gap-2">
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
            <span>Salvar unidade</span>
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

export default {
  name: "ModalQuickAddUnidadeMedida",
  components: {
    Button,
    Input,
    Label,
  },
  emits: ["created", "cancel"],
  data() {
    return {
      salvando: false,
      form: {
        nome: "",
        quantidade_unidade_minima: 1,
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
        quantidade_unidade_minima: 1,
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
      console.log(`[ModalQuickAddUnidadeMedida] ${mensagem}`);
    },
    async salvar() {
      if (this.salvando) return;

      if (!this.form.nome || !this.form.quantidade_unidade_minima) {
        this.notificar("Informe o nome e a quantidade da unidade", "error");
        return;
      }

      const payload = {
        unidadeMedida: {
          nome: this.form.nome,
          quantidade_unidade_minima: parseFloat(this.form.quantidade_unidade_minima),
          status: "A",
        },
      };

      this.salvando = true;

      try {
        const response = await this.$axios.post("/unidadeMedida/add", payload, {
          headers: {
            Authorization: "Bearer " + this.$store.getters["auth/getUserToken"],
            "Content-Type": "application/json",
          },
        });

        if (response.data?.status && response.data.data?.id) {
          const unidade = response.data.data;
          this.notificar("Unidade de medida cadastrada com sucesso", "success");
          this.$emit("created", unidade);
          this.reset();
        } else {
          this.notificar("Não foi possível cadastrar a unidade.", "error");
        }
      } catch (error) {
        this.notificar("Erro ao cadastrar unidade de medida.", "error");
        console.error("Erro ao cadastrar unidade inline", error);
      } finally {
        this.salvando = false;
      }
    },
  },
};
</script>
