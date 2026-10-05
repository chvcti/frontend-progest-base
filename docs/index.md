# 💻 ProGest Frontend Web — Visão Geral

> **Componente Backstage:** `progest-frontend-web`  
> **Tipo:** `website` | **Lifecycle:** `production` | **Owner:** `squad-progest-hgvc`  
> **Sistema:** `progest-hospitalar`

O **ProGest Frontend Web** é a interface SPA (*Single Page Application*) do sistema hospitalar ProGest. Desenvolvido com **Vue.js 3** (Composition & Options API), **Vite** e **TailwindCSS**, o painel web oferece uma experiência moderna, ágil e responsiva para profissionais de saúde (solicitantes em enfermarias e UTIs), almoxarifes/farmacêuticos hospitalares e administradores da rede.

---

## 🎯 Principais Funcionalidades da Interface

1. **Seleção Inteligente de Setor Ativo (`/setor-selection`):** Adaptação dinâmica de menus, visibilidade de botões e permissões de acordo com o polo e setor escolhido pelo usuário.
2. **Módulo de Pedidos em Busca Cega (`/pedidos`):** Interface intuitiva para que profissionais assistenciais montem solicitações de medicamentos e insumos sem expor estoques físicos de outras áreas.
3. **Triagem Ágil de Movimentações (`SetorAtualView` / `TabMovimentacoes`):** Painel do almoxarife com sugestão automática de lotes pelo critério **FIFO/FEFO**, atendimento parcial e emissão de parecer de reprovação.
4. **Lançamento de Notas Fiscais (Exclusivo CAF):** Lançamento de NFs com validação de duplicidade, datas de fabricação/vencimento e rateio por lote.
5. **Relatórios e Gráficos:** Visualização gráfica de consumo, histórico de movimentações e balanço de medicamentos sujeitos a controle especial (Portaria 344/98).
6. **Higienização de Produção:** Remoção automática de `console.log` e instruções `debugger` durante o build estático de produção.

---

## 🛠️ Stack Tecnológica

| Componente | Tecnologia | Finalidade |
|---|---|---|
| **Framework Base** | Vue.js 3.x | Arquitetura reativa de componentes |
| **Build Tool** | Vite 4+ | Compilação ultrarrápida e Hot Module Replacement (HMR) |
| **Estilização** | TailwindCSS + PostCSS | Design system responsivo e utilitários modernos |
| **Roteamento** | Vue Router 4 | Roteamento com Route Guards granulares por perfil |
| **Estado Global** | Vuex 4 | Gerenciamento centralizado de sessão, perfil e setor ativo |
| **Requisições HTTP** | Axios | Comunicação REST com interceptors de autenticação |
| **Servidor Web** | Nginx Alpine | Servidor leve para assets estáticos em container Docker |

---

## 🌐 Ambientes e Acessos Oficiais

* **Repositório GitHub:** [https://github.com/progest-hgvca/frontend-progest-base](https://github.com/progest-hgvca/frontend-progest-base)
* **Organização GitHub:** [https://github.com/progest-hgvca](https://github.com/progest-hgvca)
* **Ambiente de Produção / Homologação (AWS):** [http://18.230.26.35/](http://18.230.26.35/)
* **Ambiente de Desenvolvimento Local (Docker Desktop):** [http://app.localhost](http://app.localhost) (ou [http://localhost](http://localhost))
* **Dev Server Local (Vite / Node):** `http://localhost:5173`

---

## 📂 Mapa da Documentação Técnica

* **[Arquitetura & Componentes](architecture.md):** Estrutura de diretórios, padrões de UI, ciclo de vida e build Nginx.
* **[Rotas & Route Guards](routing-guards.md):** Especificação completa dos guards de navegação, travas de setor e bloqueios de perfil.
* **[Gerenciamento de Estado (Vuex)](state-management.md):** Módulos `auth` e `estoque`, persistência em cookies e sincronização reativa.
* **[Jornadas de Usuário](user-journeys.md):** Fluxos operacionais detalhados para Solicitante, Almoxarife e Administrador baseados no manual clínico.
* **[Deploy & Operações](deployment-operations.md):** Procedimentos de execução local, build de produção, Docker e resolução de problemas comuns.
