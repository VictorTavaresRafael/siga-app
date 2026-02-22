# SIGA API (Backend)

API REST do SIGA, implementada com NestJS, Prisma e PostgreSQL. O backend concentra autenticacao, regras de negocio por perfil, presenca, treinos, analytics e integracao externa para consulta de exercicios.

## Stack e arquitetura

- Runtime: Node.js + TypeScript
- Framework: NestJS 11
- Persistencia: PostgreSQL + Prisma
- AuthN/AuthZ: JWT + RBAC (`ADMIN`, `STUDENT`)
- Documentacao interativa: Swagger em `/api`

Modulos de dominio em `src/modules`:

- `auth`
- `users` (inclui perfil do aluno)
- `workouts`
- `attendance`
- `analytics`
- `notifications`
- `exercise-help`

## Requisitos

- Node.js 20+ (alinhado com CI)
- npm
- PostgreSQL em execucao

## Setup local

```bash
cd apps/api
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

Endpoints locais:

- API: `http://localhost:3333`
- Swagger: `http://localhost:3333/api`

## Variaveis de ambiente

Use `apps/api/.env.example` como base.

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/siga
JWT_SECRET=changeme
FRONTEND_URLS=http://localhost:4200
PORT=3333
EXERCISEDB_RAPIDAPI_KEY=
EXERCISEDB_RAPIDAPI_HOST=exercisedb.p.rapidapi.com
EXERCISEDB_BASE_URL=https://exercisedb.p.rapidapi.com
EXERCISEDB_TIMEOUT_MS=9000
EXERCISEDB_CACHE_TTL_MS=600000
```

Notas:

- `FRONTEND_URLS` aceita multiplas origens separadas por virgula.
- `EXERCISEDB_RAPIDAPI_KEY` e obrigatoria para `GET /exercise-help`.

## Scripts disponiveis

- `npm run start:dev`: sobe a API em modo watch
- `npm run build`: gera build em `dist/`
- `npm start`: executa build gerado
- `npm test`: build + testes Node (`test/*.test.js`)

## Seguranca e decisoes de implementacao

- `helmet` para headers de seguranca HTTP.
- `express-rate-limit` com janela de 15 minutos e limite de 300 requisicoes.
- CORS restrito por `FRONTEND_URLS`.
- `ValidationPipe` global com `whitelist` e `transform`.
- JWT guard + decorator de roles para autorizacao por rota.

## Contratos de API (resumo)

Autenticacao:

- `POST /auth/signup`
- `POST /auth/login`

Usuarios:

- `GET /users/students` (admin)
- `POST /users` (admin)
- `PATCH /users/:id` (admin)
- `DELETE /users/:id` (admin)
- `GET /users/students/:id/profile` (admin)
- `GET /users/me/profile` (student)
- `PATCH /users/me/profile` (student)

Treinos:

- `GET /workouts/my-workouts` (student)
- `POST /workouts` (admin)
- `PUT /workouts/:id` (admin)

Presenca:

- `POST /attendance/check-in` (student)
- `GET /attendance/me/today` (student)
- `GET /attendance/analytics/frequency` (admin)

Analytics:

- `GET /analytics/frequency`
- `GET /analytics/summary`
- `GET /analytics/demographics`
- `GET /analytics/series`
- `GET /analytics/export` (CSV)

Notificacoes:

- `POST /notifications` (student)
- `GET /notifications` (admin)
- `GET /notifications/me` (student)
- `GET /notifications/unread-count` (admin)
- `PATCH /notifications/:id/read` (admin)
- `PATCH /notifications/:id/reply` (admin)

Consulta de exercicios:

- `GET /exercise-help?name=<nome>` (JWT obrigatorio)

## Seed e dados de desenvolvimento

O seed cria:

- 1 admin
- 30 alunos
- treinos com exercicios por aluno
- historico de presencas
- notificacoes com e sem resposta

Credenciais:

- Admin: `admin@siga.com.br` / `siga123`
- Alunos: `aluno1@siga.com.br` ate `aluno30@siga.com.br` / `siga123`

## Testes

Testes unitarios disponiveis em `apps/api/test`:

- `auth.service.test.js`
- `attendance.service.test.js`
- `users.service.test.js`

Execucao:

```bash
npm test
```

## Deploy

Checklist de producao:

1. Configurar variaveis de ambiente (`DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URLS`, etc).
2. Executar migracoes: `npx prisma migrate deploy`.
3. Gerar e iniciar build: `npm run build && npm start`.

Plataformas comuns: Railway, Render, Fly.io, VM/container proprio.
