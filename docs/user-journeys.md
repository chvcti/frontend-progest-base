# 🚶 Jornadas de Usuário e Operação Clínica

Baseado no **Manual Unificado do Usuário ProGest**, este documento detalha o fluxo operacional de ponta a ponta na interface web para os três perfis de atuação no hospital.

---

## 👩‍⚕️ 1. Jornada do Solicitante (Enfermaria, UTI, Clínicas)

```
[Login] ➜ [Selecionar Setor] ➜ [Fazer Pedido /pedidos] ➜ [Buscar Itens (Busca Cega)] ➜ [Enviar para Triagem] ➜ [Acompanhar Status]
```

### Passo a Passo Operacional:
1. **Login e Acesso:** O profissional entra com seu e-mail e senha.
2. **Seleção de Setor:** Escolhe o polo e seu setor assistencial de atuação (ex: *Polo HGVC > UTI Adulto*).
3. **Criação da Solicitação (`/pedidos`):**
   - O solicitante escolhe o setor distribuidor autorizado (ex: *Farmácia de Dispensação* ou *CAF*).
   - Utiliza a barra de pesquisa cega para localizar medicamentos ou materiais (digitando o nome ou código SIMPAS). O sistema não exibe o saldo de estoque do fornecedor para evitar direcionamento indevido de itens.
   - Informa as quantidades solicitadas.
4. **Submissão do Pedido:**
   - Pode **Salvar Rascunho** (status `C`) para complementar a lista durante o plantão.
   - Ao finalizar, clica em **Enviar Pedido**, mudando o status para **Pendente** (`P`).
5. **Acompanhamento e Cancelamento:**
   - Na listagem de pedidos, o solicitante visualiza o status em tempo real.
   - Caso um procedimento seja suspenso pelo médico antes do atendimento da farmácia, o solicitante pode clicar em **Cancelar Pedido** (status `X`).
6. **Devolução de Sobras:**
   - Sobras de medicamentos lacrados de pacientes que tiveram alta ou transferência são registradas clicando em **Devolver Itens**, indicando o motivo clínico.

---

## 👨‍💼 2. Jornada do Almoxarife e Farmacêutico (Setores com Estoque)

```
[Login] ➜ [Selecionar Farmácia] ➜ [Aba Movimentações] ➜ [Triagem FIFO/FEFO] ➜ [Dispensar / Atendimento Parcial] ➜ [Lançar NF (se CAF)]
```

### Passo a Passo Operacional:
1. **Triagem de Solicitações (`SetorAtualView > TabMovimentacoes`):**
   - Visualiza a fila de pedidos pendentes (`P`) enviados pelas enfermarias e UTIs.
   - Clica em **Atender Pedido** para abrir o modal de alocação física.
2. **Sugestão de Lotes por FIFO/FEFO:**
   - A interface aciona o endpoint de preview de lotes e preenche automaticamente os frascos/ampolas com data de vencimento mais próxima.
   - O almoxarife confere a separação física na prateleira.
3. **Liberação ou Reprovação:**
   - **Atendimento Integral:** Libera 100% da quantidade solicitada.
   - **Atendimento Parcial:** Se houver contingenciamento ou escassez temporária, reduz a quantidade liberada. O sistema preserva o registro original do que foi pedido.
   - **Reprovação com Parecer:** Se a cota estiver excedida ou a prescrição estiver incorreta, reprova o pedido informando a justificativa clínica obrigatória.
4. **Lançamento de Notas Fiscais (Exclusividade na CAF):**
   - Ao operar na CAF, clica na aba **Entrada de NF**.
   - Digita o número da Nota Fiscal, seleciona o fornecedor homologado e insere os lotes com datas de fabricação, vencimento e valores unitários.
   - Ao confirmar, o estoque físico é creditado imediatamente.

---

## 👔 3. Jornada do Administrador (Polo, CAF e Super Admin)

```
[Governança] ➜ [Gestão de Equipe] ➜ [Manutenção de Catálogo] ➜ [Relatórios Analíticos e Portaria 344]
```

### Passo a Passo Operacional:
1. **Gestão de Equipe (`/users` e aba `Equipe` do setor):**
   - Vincula profissionais de saúde aos seus respectivos setores e atribui perfis (`solicitante`, `almoxarife`, `admin`).
   - O sistema valida automaticamente para impedir que almoxarifes sejam vinculados a setores assistenciais sem estoque.
2. **Manutenção do Catálogo Mestre (Exclusivo Admin CAF):**
   - Cadastro e inativação de produtos no padrão SIMPAS (`/produtos`).
   - Gerenciamento de fornecedores homologados (`/fornecedores`) e grupos de produtos.
3. **Auditoria e Relatórios:**
   - Emissão do balanço de medicamentos sujeitos a controle especial (Portaria 344/98) para envio à Vigilância Sanitária.
   - Relatórios financeiros de consumo por centro de custo para a diretoria hospitalar.
