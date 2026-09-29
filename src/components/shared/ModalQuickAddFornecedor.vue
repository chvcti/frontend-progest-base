<template>
  <div class="mt-3 p-3 border rounded bg-light">
    <h6 class="mb-3 text-primary font-semibold">Cadastrar fornecedor rapidamente</h6>
    <div class="row g-3">
      <div class="col-md-4">
        <Label for="novoFornecedorNome">
          Razão social / Nome
          <span class="text-danger">*</span>
        </Label>
        <Input
          id="novoFornecedorNome"
          v-model="form.nome"
          type="text"
          class="text-uppercase"
          placeholder="Digite o nome do fornecedor"
        />
      </div>

      <div class="col-md-4">
        <Label for="novoFornecedorTipo">Tipo de pessoa</Label>
        <Select v-model="form.tipo">
          <SelectTrigger id="novoFornecedorTipo" class="w-full">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="J">Pessoa Jurídica</SelectItem>
            <SelectItem value="F">Pessoa Física</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="col-md-4">
        <Label for="novoFornecedorDocumento">
          {{ form.tipo === "J" ? "CNPJ" : "CPF" }}
          <span class="text-danger">*</span>
        </Label>
        <Input
          id="novoFornecedorDocumento"
          v-model="form.documento"
          type="text"
          placeholder="Somente números"
        />
      </div>

      <div class="col-12 d-flex justify-content-end gap-2">
        <Button
          variant="outline"
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
          :disabled="salvando || !form.nome || !form.documento"
        >
          <template v-if="!salvando">
            <i class="mdi mdi-check me-1"></i>
            <span>Salvar fornecedor</span>
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
import cadFornecedores from "@/functions/cad_fornecedores.js";

export default {
  name: "ModalQuickAddFornecedor",
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
        documento: "",
        tipo: "J",
      },
    };
  },
  watch: {
    "form.tipo"() {
      this.form.documento = "";
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
        documento: "",
        tipo: "J",
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
      console.log(`[ModalQuickAddFornecedor] ${mensagem}`);
    },
    async salvar() {
      if (this.salvando) return;

      if (!this.form.nome) {
        this.notificar("Informe o nome do fornecedor", "error");
        return;
      }

      const documentoNumerico = (this.form.documento || "").replace(/\D/g, "");
      const isPessoaJuridica = this.form.tipo === "J";
      const documentoValido = isPessoaJuridica
        ? documentoNumerico.length === 14
        : documentoNumerico.length === 11;

      if (!documentoValido) {
        const mensagem = isPessoaJuridica
          ? "CNPJ deve ter 14 dígitos"
          : "CPF deve ter 11 dígitos";
        this.notificar(mensagem, "error");
        return;
      }

      const payload = {
        fornecedor: {
          razao_social_nome: this.form.nome,
          tipo_pessoa: this.form.tipo,
          status: "A",
          cnpj: isPessoaJuridica ? documentoNumerico : null,
          cpf: !isPessoaJuridica ? documentoNumerico : null,
        },
      };

      this.salvando = true;

      try {
        const response = await this.$axios.post("/fornecedores/add", payload, {
          headers: {
            Authorization: "Bearer " + this.$store.getters["auth/getUserToken"],
          },
        });

        if (response.data?.status && response.data.data?.id) {
          const fornecedor = response.data.data;
          this.notificar("Fornecedor cadastrado com sucesso", "success");
          this.$emit("created", fornecedor);
          this.reset();
        } else {
          const mensagem =
            response.data?.message ||
            "Não foi possível cadastrar o fornecedor. Tente novamente.";
          this.notificar(mensagem, "error");
        }
      } catch (error) {
        const mensagem =
          error.response?.data?.message ||
          error.response?.data?.erros?.[0] ||
          "Erro ao cadastrar fornecedor. Verifique os dados e tente novamente.";
        this.notificar(mensagem, "error");
        console.error("Erro ao cadastrar fornecedor inline", error);
      } finally {
        this.salvando = false;
      }
    },
  },
};
</script>
