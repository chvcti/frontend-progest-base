# 🚦 Roteamento e Route Guards de Segurança

O roteamento da aplicação é gerenciado pelo **Vue Router** com uma camada sofisticada de **Navigation Guards (`beforeEach`)**, garantindo que nenhum usuário acerte telas ou recursos incompatíveis com o seu perfil ou com a classificação física do setor ativo.

---

## 🗺️ Mapa de Rotas Principais

| Rota | View | Metadados de Proteção | Papéis Permitidos |
|---|---|---|---|
| `/login` | `Login.vue` | Pública | Todos |
| `/register` | `Register.vue` | Pública | Todos |
| `/setor-selection` | `SetorSelectionView.vue` | `requiresAuth: true` | Todos autenticados |
| `/setor-atual` | `SetorAtualView.vue` | `requiresAuth: true`, `requiresSector: true` | Todos com setor ativo |
| `/pedidos` | `PedidosView.vue` | `requiresAuth: true`, `requiresSector: true`, `forbiddenForCAF: true` | Solicitante, Almoxarife (ressuprimento) |
| `/produtos` | `cadastros/Produtos.vue` | `requiresAuth: true`, `roles: ['admin']` | Administradores da CAF e globais |
| `/fornecedores` | `cadastros/Fornecedores.vue` | `requiresAuth: true`, `roles: ['admin']` | Administradores da CAF e globais |
| `/setores` | `cadastros/Setores.vue` | `allowAdminSetores: true`, `roles: ['admin']` | Admin Polo, Admin CAF, Super Admin |
| `/polos` | `cadastros/Polos.vue` | `globalAdminOnly: true` | Exclusivo Super Admin |
| `/users` | `cadastros/Users.vue` | `roles: ['admin']` | Administradores |
| `/relatorios/*` | `relatorios/*.vue` | `roles: ['admin', 'almoxarife']` | Almoxarife e Administrador |

---

## 🛡️ Especificação dos Route Guards

O arquivo `src/router/index.js` implementa a seguinte sequência de validações a cada transição de tela:

### 1. Guard de Autenticação (`requiresAuth`)
* Se a rota exigir autenticação e o token não for encontrado no `sessionStorage` ou `localStorage`, a sessão é limpa e o usuário é redirecionado para `/login`.

### 2. Guard de Seleção Obrigatória de Setor (`requiresSector`)
* Se a rota exigir um setor ativo e o usuário ainda não tiver selecionado um (validado via `setorCookie.hasSector()`), o sistema o redireciona obrigatoriamente para `/setor-selection`.
* **Exceção do Super Admin:** O Super Administrador possui permissão para navegar nas telas de governança mestra mesmo antes de fixar um setor.

### 3. Guard de Isolamento do Solicitante
* Usuários com perfil `solicitante` possuem navegação estritamente limitada a:
  - `/setor-atual` (Aba do setor sem botões de edição ou estoque físico)
  - `/pedidos` (Módulo de pedidos em busca cega)
  - `/setor-selection` (Troca de setor de atuação)
* Qualquer tentativa de acessar rotas de cadastros ou relatórios redireciona imediatamente para `/setor-atual`.

### 4. Guard de Bloqueio de Cadastros para Almoxarifes e Solicitantes
* Almoxarifes e Solicitantes não têm acesso às rotas de cadastros mestres (`/produtos`, `/fornecedores`, `/polos`, `/setores`, `/users`). Tentativas de acesso são bloqueadas e enviadas para o `/dashboard` ou `/setor-atual`.

### 5. Guard de Restrição da CAF em `/pedidos` (`forbiddenForCAF: true`)
* Como a CAF é o fornecedor central da rede, ela não cria pedidos em `/pedidos` para outros setores; ela apenas ressupre ou recebe de fornecedores externos via Nota Fiscal. Tentativas de abrir `/pedidos` com a CAF selecionada redirecionam para `/setor-atual`.

### 6. Guard de Exclusividade Global (`globalAdminOnly: true`)
* Rotas como `/polos` são exclusivas do Super Administrador (`adminti@gmail.com`). Usuários sem a flag `is_super_admin` são sumariamente bloqueados.
