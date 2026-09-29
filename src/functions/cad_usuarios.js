import { feedback } from "@/components/ui/feedback-modal";

var ADD_UP = (content, funcao) => {
  // Construir payload do usuário removendo campos de vinculação a setores/unidades
  const rawUserData =
    funcao == "ADD" || funcao == "UP"
      ? { ...content.modalData }
      : { ...content.user_data };
  // Remover campos relacionados a Setores/Unidades — vinculação será gerenciada por outro módulo
  delete rawUserData.Setores;
  delete rawUserData.setores;
  delete rawUserData.unidades;

  content.$axios
    .post(
      funcao == "ADD" ? "/user/add" : "/user/update",
      {
        user: rawUserData,
      },
      {
        headers: {
          Authorization: "Bearer " + content.$store.getters["auth/getUserToken"],
        },
      }
    )
    .then(function (response) {
      if (response.data.status) {
        listALL(content);

        if (funcao == "ADD") {
          content.modalData.id = response.data.data.id;
          content.$store.commit("setIdDataLoaded", response.data.data.id);
        }
        content.$store.commit("setModalTitle", response.data.data.name);
        content.$store.commit("setModalFunction", "UP");
        content.$store.commit("setModalErrors", {});

        // Fechar o modal antes de exibir o feedback
        if (content.onSuccess && typeof content.onSuccess === "function") {
          content.onSuccess();
        }

        feedback.success(
          funcao == "ADD"
            ? "Usuário cadastrado com sucesso!"
            : "Usuário atualizado com sucesso!"
        );
      } else {
        console.log("Erro inesperado com status 200", response);
      }
    })
    .catch(function (error) {
      console.error("Erro capturado globalmente:", error);
      // Erros 422 já são tratados pelo interceptor global (main.js): ele preenche
      // modalErrors e abre o modal de validação com as mensagens do backend.
      // Tratar aqui sobrescreveria esse feedback por uma mensagem genérica.
      if (error.response && error.response.status === 422) return;

      feedback.error(error.response?.data?.message || "Erro ao salvar usuário.");
    });
};


var EDIT_PERFIL = (content, funcao) => {
  // Ao editar perfil, garantir que não enviamos Setores/Unidades por este módulo
  const userPayload = { ...content.user_data };
  delete userPayload.Setores;
  delete userPayload.setores;
  delete userPayload.unidades;

  content.$axios
    .post(
      "/user/update",
      {
        user: userPayload,
      },
      {
        headers: {
          Authorization: "Bearer " + content.$store.getters["auth/getUserToken"],
        },
      }
    )
    .then(function (response) {
      if (response.data.status) {
        // content.$toastr.s(
        //   funcao == "ADD" ? "Cadastrado" : "Atualizado" + " com sucesso"
        // );
        content.$store.commit("setListUserPerfil", response.data.data);
        sessionStorage.setItem("user", JSON.stringify(response.data.data));
        console.log("USER:", response.data.data);
      }
    })
    .catch(function (error) {
      console.log("Erro ao editar perfil:", error);
    });
};

var listALL = (content, url = null) => {
  content.$store.commit("setisSearching", true);
  content.$axios
    .post(
      url == null ? "/user/list" : url,
      {
        filters: content.$store.state.searchFilters,
        search: content.search || "",
        sort_by: content.sort_by || "name",
        sort_dir: content.sort_dir || "asc",
        regime_contratacao_id: content.regime_contratacao_id || "",
      },
      {
        headers: {
          Authorization: "Bearer " + content.$store.getters["auth/getUserToken"],
        },
      }
    )
    .then((response) => {
      if (response.data.status && response.data.data) {
        // Substituir os valores dos usuários pelos nomes legíveis
        const enrichedUsers = response.data.data.map((user) => {
          const RegimesContratacao = content.$store.state.cadastros.listRegimesContratacao || [];
          const regimeContratacao = RegimesContratacao.find(
            (tipo) => tipo.id == user.regime_contratacao_id
          );

          return {
            ...user,
            // Preservar o ID original do tipo de vínculo
            regime_contratacao_id: user.regime_contratacao_id,
            // Substitui o valor numérico pelo nome do tipo de vínculo
            regime_contratacao_nome: regimeContratacao ? regimeContratacao.nome : "N/A",
            // Substitui A/I por Ativo/Inativo
            status: user.status === "A" ? "Ativo" : "Inativo",
          };
        });

        content.$store.commit("cadastros/setListUsers", enrichedUsers);
      } else {
        console.error("Resposta da API sem dados válidos:", response.data);
        content.$store.commit("cadastros/setListUsers", []);
      }

      content.$store.commit("setisSearching", false);
    })
    .catch((error) => {
      console.error("Erro na chamada da API listALL:", error);
      content.$store.commit("setisSearching", false);
      content.$store.commit("cadastros/setListUsers", []);
    });
};

var listData = (content) => {
  const abaDados = document.querySelector("#aba_dados");
  if (abaDados) abaDados.click();
  content.$axios
    .post(
      "/user/listData",
      { id: content.idData },
      {
        headers: {
          Authorization: "Bearer " + content.$store.getters["auth/getUserToken"],
        },
      }
    )
    .then((response) => {
      // Ao popular o modal, remover os vínculos a Setores/Unidades — estes serão gerenciados por outro módulo
      const modalPayload = { ...response.data.data };
      delete modalPayload.Setores;
      delete modalPayload.setores;
      delete modalPayload.unidades;

      content.$store.commit("setIdDataLoaded", content.idData);
      content.$store.commit("setModalData", modalPayload);
      content.$store.commit("setModalFunction", "UP");
      content.$store.commit(
        "setModalTitle",
        response.data.data.name || "Editar Usuário"
      );
      console.log("IMPRIMINDO OS DADOS DO USUÁRIO: ", response.data);
      if (content.callback) content.callback(); // Chama o callback após carregar os dados
    })
    .catch((error) => {
      console.error("Erro capturado globalmente em listData:", error);
    });
};



// Mantém apenas a função de tipos de vínculo que é obrigatória
var listRegimesContratacao = (content, url = null) => {
  const fetchUrl = url == null ? "/regime-contratacao/list" : url;
  return content.$axios
    .post(
      fetchUrl,
      {},
      {
        headers: {
          Authorization: "Bearer " + content.$store.getters["auth/getUserToken"],
        },
      }
    )
    .then((response) => {
      const regimes = response.data?.data || [];
      content.$store.commit("cadastros/setListRegimesContratacao", regimes);
      console.log("setListRegimesContratacao", regimes);
      return regimes;
    })
    .catch((error) => {
      console.warn("Tentativa em /regime-contratacao/list falhou, tentando fallback...", error);
      if (url == null) {
        return content.$axios
          .post("/tipo-vinculo/list", {}, {
            headers: {
              Authorization: "Bearer " + content.$store.getters["auth/getUserToken"],
            },
          })
          .then((res) => {
            const regimes = res.data?.data || [];
            content.$store.commit("cadastros/setListRegimesContratacao", regimes);
            return regimes;
          })
          .catch(() => {
            content.$store.commit("cadastros/setListRegimesContratacao", []);
            return [];
          });
      }
      content.$store.commit("cadastros/setListRegimesContratacao", []);
      return [];
    });
};

var listPolos = (content, url = null) => {
  return content.$axios
    .post(
      url == null ? "/setores/list" : url,
      {},
      {
        headers: {
          Authorization: "Bearer " + content.$store.getters["auth/getUserToken"],
        },
      }
    )
    .then((response) => {
      content.$store.commit("cadastros/setListSetoresGerais", response.data.data);
      console.log("setListSetoresGerais", response.data.data);
      return response.data.data;
    })
    .catch((error) => {
      console.error("Erro ao carregar unidades:", error);
      content.$store.commit("cadastros/setListPolos", []);
      throw error;
    });
};

var deleteData = (content, id) => {

  content.$axios
    .post(
      `/user/delete/${id}`,
      {},
      {
        headers: {
          Authorization: "Bearer " + content.$store.getters["auth/getUserToken"],
        },
      }
    )
    .then((response) => {
      if (response.data.status) {
        listALL(content);
        feedback.success(response.data.message || "Status atualizado com sucesso!");
      } else {
        feedback.error(response.data.message || "Erro ao alterar status.");
      }
    })
    .catch((error) => {
      console.error("Erro ao alterar status do usuário:", error);
    });
};

var exportFunctions = {
  ADD_UP: ADD_UP,
  listALL: listALL,
  listData: listData,
  deleteData: deleteData,
  EDIT_PERFIL: EDIT_PERFIL,
  listRegimesContratacao: listRegimesContratacao,
  listPolos: listPolos,
};

export default exportFunctions;
