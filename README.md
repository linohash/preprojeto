# Projeto Base Full Stack

Template para alunos criarem forks com a mesma stack de frontend, backend e banco de dados.

## Stack Padrao

- Frontend: Next.js `16.2.10` com JavaScript, sem Tailwind e sem Bootstrap por padrao.
- Backend: Node.js com Express em JavaScript.
- Banco de dados: MySQL.
- Deploy: Dockerfiles separados para frontend, backend e banco, facilitando criacao de servicos.

## Estrutura

```text
.
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── database/
│   ├── init/
│   │   └── 01-schema.sql
│   └── Dockerfile
├── frontend/
│   ├── src/app/
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```

## Como Rodar Localmente

1. Instale as dependencias:

```bash
cd backend
npm install

cd ../frontend
npm install
```

2. Copie os arquivos de ambiente:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

3. Suba o MySQL com Docker (se for rodar com XAMPP ou MySQL Community Server, ignorar passo):

```bash
docker compose up -d database
```

4. Rode o backend:

```bash
cd backend
npm run dev
```

5. Rode o frontend:

```bash
cd frontend
npm run dev
```

URLs padrao:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`
- Health check da API: `http://localhost:8080/api/health`
- MySQL: `localhost:3306`

## Rodando Tudo com Docker Compose

```bash
docker compose up --build
```

Esse comando sobe:

- `frontend` na porta `3000` por padrao
- `backend` na porta `8080` por padrao
- `database` na porta `3306` por padrao

## Variaveis de Ambiente

Docker Compose raiz (`.env`):

```env
FRONTEND_HOST_PORT=3000
BACKEND_HOST_PORT=8080
DATABASE_HOST_PORT=3306

FRONTEND_PORT=3000
BACKEND_PORT=8080

FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8080/api

MYSQL_ROOT_PASSWORD=root_password
MYSQL_DATABASE=app_db
MYSQL_USER=app_user
MYSQL_PASSWORD=app_password

DB_HOST=database
DB_PORT=3306
DB_USER=app_user
DB_PASSWORD=app_password
DB_NAME=app_db
```

Para rodar varios grupos no mesmo servidor, mude pelo menos as portas publicadas no host e a URL publica da API. Exemplo para um segundo grupo:

```env
FRONTEND_HOST_PORT=3001
BACKEND_HOST_PORT=8081
DATABASE_HOST_PORT=3307
FRONTEND_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:8081/api
```

As portas internas podem continuar nos defaults (`FRONTEND_PORT=3000` e `BACKEND_PORT=8080`) na maioria dos casos. Altere as portas internas apenas se o Coolify ou a arquitetura escolhida exigirem.

Backend (`backend/.env`):

```env
PORT=8080
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=3306
DB_USER=app_user
DB_PASSWORD=app_password
DB_NAME=app_db
```

Frontend (`frontend/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

No Docker Compose, o backend usa `DB_HOST=database`, porque esse e o nome do servico MySQL na rede Docker.

## Backend

Scripts principais:

```bash
npm run dev
npm start
```

Rotas iniciais:

- `GET /` retorna uma mensagem basica da API.
- `GET /api/health` retorna status da API e testa a conexao com MySQL.

Pastas padrao:

- `src/config`: configuracoes e conexoes externas.
- `src/controllers`: funcoes que tratam requisicoes.
- `src/routes`: definicao das rotas HTTP.
- `src/middlewares`: middlewares compartilhados.

## Frontend

Scripts principais:

```bash
npm run dev
npm run build
npm start
npm run lint
```

O projeto esta sem Tailwind e sem Bootstrap por padrao. Cada aluno pode instalar e configurar a biblioteca CSS escolhida conforme a necessidade do projeto.

## Banco de Dados

O arquivo `database/init/01-schema.sql` cria a base inicial quando o container MySQL sobe pela primeira vez.

O arquivo `database/init/01-schema.sql` é a referência do banco. O backend valida as tabelas necessárias ao iniciar e não cria nem altera tabelas ou colunas. A remoção de volumes com `docker compose down -v` apaga o banco e as evidências anexadas.

## Deploy no Coolify

Crie servicos separados apontando para os Dockerfiles:

- Frontend: `frontend/Dockerfile`
- Backend: `backend/Dockerfile`
- Banco: preferencialmente use o servico gerenciado de MySQL do Coolify. Se quiser usar a imagem do repo, use `database/Dockerfile`.

Configure no Coolify as variaveis de ambiente equivalentes aos arquivos `.env.example`. No backend, `DB_HOST` deve apontar para o host/nome interno do servico MySQL no Coolify.

Para cada grupo, configure valores diferentes para:

- `FRONTEND_HOST_PORT`
- `BACKEND_HOST_PORT`
- `DATABASE_HOST_PORT`, se estiver publicando MySQL no host
- `FRONTEND_URL`
- `NEXT_PUBLIC_API_URL`

Em deploy com dominio/reverse proxy, `NEXT_PUBLIC_API_URL` deve apontar para a URL publica real do backend, por exemplo `https://api-grupo-01.seudominio.com/api`.

## Observacoes Para Alunos

- Nao versionar arquivos `.env`.
- Nao versionar `node_modules`, `.next` ou arquivos de build.
- Manter o backend em JavaScript.
- Instalar Tailwind ou Bootstrap apenas se o projeto precisar.

## IndustriAlert

O portal Next.js fica em `frontend/` e a API Express em `backend/`. O schema `database/init/01-schema.sql` define as tabelas usadas pela aplicação; o servidor valida a presença delas sem alterar o banco.

### Inicialização local

Na raiz do projeto, copie `.env.example` para `.env`, `backend/.env.example` para `backend/.env` e `frontend/.env.example` para `frontend/.env.local`. Use um `JWT_SECRET` próprio com pelo menos 32 caracteres fora do ambiente local.

Suba o banco e inicie os serviços em dois terminais:

```powershell
docker compose up -d database
cd backend
npm ci
npm run dev
```

```powershell
cd frontend
npm ci
npm run dev
```

Portal: `http://localhost:3000`. API: `http://localhost:8080`. O MySQL precisa estar acessível e a tabela `usuarios` precisa conter uma conta ativa para permitir o login. O perfil é lido do campo `usuarios.descricao` (`Administrador`, `Gestor` ou `Técnico`).

As senhas são armazenadas com hash scrypt. Hashes SHA-256 existentes são convertidos para scrypt no primeiro login bem-sucedido. O projeto não cria contas automaticamente.

Rotas principais: `POST /api/auth/login`, `GET|POST /api/ocorrencias`, `GET|PATCH /api/ocorrencias/:id`, `PATCH /api/ocorrencias/:id/status`, `POST /api/ocorrencias/:id/evidencias`, `GET /api/dashboard`, `GET|POST|PATCH /api/setores`, `/api/maquinas`, `/api/usuarios` e `/api/tipos-ocorrencia`. As operações protegidas usam token Bearer.

Os anexos aceitos são JPEG, PNG e PDF até 5 MB; os arquivos ficam em `backend/uploads/` (ou no caminho configurado em `UPLOAD_DIR`). Em produção, configure armazenamento persistente e restrinja a permissão de acesso ao diretório.
