# 🚀 Deploy, Build e Operações — Frontend

Este guia orienta o time de desenvolvimento e DevOps sobre a execução local, compilação de produção e deploy da interface web do ProGest.

---

## 💻 1. Execução em Ambiente de Desenvolvimento

Existem duas formas suportadas de rodar o frontend localmente:

### Forma A: Via Node.js / Vite (HMR Rápido)
Ideal para desenvolvimento de interface e telas com atualização instantânea (Hot Module Replacement).
1. Instale as dependências:
   ```bash
   npm install
   ```
2. Crie ou configure o arquivo `.env.development`:
   ```env
   VITE_API_URL=http://localhost:8000/api
   APP_DOMAIN=app.localhost
   ```
3. Inicie o servidor Vite:
   ```bash
   npm run dev
   ```
   *Acesse em `http://localhost:5173`.*

---

### Forma B: Via Docker Local com Traefik
Ideal para validar o fluxo real em contêineres idêntico à produção.
1. Configure as variáveis em `.env`:
   ```env
   APP_DOMAIN=app.localhost
   VITE_API_URL=http://${APP_DOMAIN}/api
   ```
2. Suba o container Nginx:
   ```bash
   docker compose -f docker-compose.local.yml up -d --build
   ```
   *Acesse em `http://app.localhost` ou `http://localhost`.*

> ⚠️ **Atenção:** Como o `VITE_API_URL` é injetado durante o build da imagem do Docker, sempre que alterar essa variável no `.env`, a flag `--build` é obrigatória.

---

## 🌐 2. Deploy em Servidor de Produção (AWS / Linux)

No servidor de homologação ou produção oficial:

```bash
cd ~/frontend-progest-base

# 1. Configurar variáveis de produção
cp .env.aws.example .env.aws

# 2. Definir o IP público ou domínio oficial (ex: 18.230.26.35)
sed -i 's/APP_DOMAIN=IP_DA_AWS/APP_DOMAIN=18.230.26.35/g' .env.aws

# 3. Construir e subir o container oficial
docker compose -f docker-compose.aws.yml up -d --build
```

---

## 🧹 3. Higienização de Produção

Para proteger informações confidenciais do hospital e dados de pacientes, o arquivo `vite.config.ts` conta com sanitização automática através da biblioteca de minificação esbuild:
```typescript
build: {
  minify: 'esbuild',
}
esbuild: {
  drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
}
```
Durante o comando `npm run build`, todas as instruções de debug e logs do console são removidas do bundle JavaScript final.

---

## 🚨 4. Resolução de Problemas Comuns (Troubleshooting)

### Erro: `Not allowed to load local resource: chrome-error://chromewebdata`
* **Causa:** O proxy reverso Traefik não está rodando na porta 80 ou a rede `traefik-public` não foi criada.
* **Solução:** Suba o Traefik na pasta `traefik` com `docker compose up -d` e garanta que o container do frontend está conectado à rede `traefik-public`.

### Erro: `404 Not Found` ao recarregar a página (F5) em rotas como `/pedidos`
* **Causa:** O Nginx está tentando buscar um arquivo físico `/pedidos/index.html` em vez de repassar a rota para o index.html da SPA.
* **Solução:** O `nginx.conf` da imagem deve conter `try_files $uri $uri/ /index.html;`.

### Erro: `CORS Policy Blocked`
* **Causa:** O Frontend e o Backend estão sendo chamados em origens/portas diferentes sem cabeçalhos de preflight liberados.
* **Solução:** No ambiente Docker com Traefik, o frontend e backend compartilham o mesmo domínio base (`APP_DOMAIN`), com a API respondendo no prefixo `/api` (`VITE_API_URL=/api`), eliminando qualquer bloqueio de CORS.
