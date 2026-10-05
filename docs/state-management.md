# 📦 Gerenciamento de Estado Global (Vuex)

O gerenciamento de estado do ProGest é centralizado no **Vuex 4**, estruturado em módulos especializados para gerenciar autenticação, permissões e dados do setor ativo.

---

## 🗄️ Estrutura dos Módulos da Store

```
src/vuex/
├── store.js            # Instância principal e unificação dos módulos
├── auth/
│   ├── state.js        # token, user, status de autenticação
│   ├── getters.js      # isSuperAdmin, isAuthenticated, userRoles
│   ├── mutations.js    # setToken, setUser, clearAuth
│   └── actions.js      # login, logout, refreshToken
└── estoque/
    ├── state.js        # setorAtualId, setorAtualNome, setorDetails, listUsuariosSetor
    ├── getters.js      # isSetorEstoque, isCAF, canManageStock
    ├── mutations.js    # setSetorAtual, setSetorDetails, setUsuariosSetor
    └── actions.js      # loadSetorDetails, fetchUsuariosSetor
```

---

## 🔑 Módulo `auth`

Responsável pelo ciclo de vida da identidade do usuário logado:

### Estado (`state`):
* `token`: Token Bearer fornecido pelo Laravel Sanctum.
* `user`: Objeto contendo dados cadastrais, e-mail, flag `is_super_admin` e array de setores vinculados (`user.setores`).

### Getters Chave:
* `isSuperAdmin`: Retorna `true` se o usuário possui permissão global raiz (`adminti@gmail.com`).
* `isAuthenticated`: Verifica se há token válido ativo.

---

## 🏥 Módulo `estoque`

Gerencia o contexto do setor físico no qual o usuário está operando:

### Estado (`state`):
* `setorAtualId`: ID numérico do setor selecionado.
* `setorAtualNome`: Nome oficial do setor.
* `setorDetails`: Objeto completo do setor retornado pela API, contendo flags críticas como `estoque` (`true`/`false`), tipo (`Medicamento`, `Material`, `Ambos`) e polo ao qual pertence.
* `listUsuariosSetor`: Lista de colaboradores vinculados ao setor com seus respectivos perfis.

### Getters Chave:
* `isSetorEstoque`: Avalia se o setor atual possui acervo físico (`setorDetails.estoque === true`). Determina se a aba de Estoque Físico e os botões de movimentação devem ser exibidos.
* `isCAF`: Avalia se o setor atual é a Central de Abastecimento Farmacêutico (verificado pelo nome conter `CAF` ou `FARMÁCIA CENTRAL`). Habilita a aba e os botões exclusivos de **Entrada de Notas Fiscais**.

---

## 🍪 Persistência Híbrida: Vuex + Cookies

Para garantir que a navegação do usuário não se perca ao recarregar a página (F5) ou abrir abas secundárias, o ProGest adota persistência híbrida:
1. Ao selecionar um setor em `SetorSelectionView.vue`, o helper `setorCookie.setSector(id, nome)` grava os dados em cookies do navegador.
2. O Route Guard (`router.beforeEach`) detecta a presença do cookie e restaura os dados no Vuex automaticamente:
   ```javascript
   store.commit("estoque/setSetorAtual", {
     id: setorId,
     nome: setorNome,
   });
   ```
3. Ao efetuar logout ou trocar de setor, `setorCookie.clearSector()` remove os cookies de forma segura.
