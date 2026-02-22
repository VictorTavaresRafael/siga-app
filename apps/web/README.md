# SIGA Web (Frontend)

Aplicacao frontend do SIGA, desenvolvida em Angular 21 com componentes standalone, Angular Material e RxJS. O projeto atende dois perfis (admin e aluno) com navegacao e autorizacao por guarda de rota.

## Stack e organizacao

- Angular 21 (`@angular/build:application`)
- TypeScript
- Angular Material + CDK
- RxJS
- Chart.js + ng2-charts
- ZXing (`@zxing/ngx-scanner`) para fluxo de check-in por QR Code
- jsPDF para exportacoes no cliente

Estrutura principal em `src/app`:

- `core/guards`: `authGuard`, `adminGuard`, `presenceGuard`
- `core/services`: clientes HTTP para cada dominio da API
- `features/auth`: login
- `features/dashboard`: check-in e painel de aluno
- `features/admin`: gestao de alunos, treinos, notificacoes e visao analitica

## Requisitos

- Node.js 20+ (alinhado com CI)
- npm

## Setup local

```bash
cd apps/web
npm install
npm start
```

App local: `http://localhost:4200`

## Configuracao de ambiente

A URL da API e definida nos arquivos:

- `src/environments/environment.development.ts` (dev)
- `src/environments/environment.ts` (producao)

Parametro utilizado:

```ts
apiUrl: 'http://localhost:3333'
```

Antes de build/deploy de producao, ajuste `environment.ts` para a URL publica da API.

## Fluxo de rotas e autorizacao

Rotas principais:

- `/login`: publica
- `/dashboard`: protegida por autenticacao + presenca do aluno no dia
- `/check-in`: protegida por autenticacao
- `/admin`: protegida para perfil `ADMIN`

Regras implementadas:

- token JWT armazenado em `localStorage`
- validacao de expiracao (`exp`) nos guards
- redirecionamento automatico por perfil
- aluno sem check-in no dia e redirecionado para `/check-in`

## Scripts disponiveis

- `npm start`: servidor de desenvolvimento (`ng serve`)
- `npm run build`: build de producao
- `npm run watch`: build em modo watch (development)
- `npm test`: testes unitarios Angular

## Integracao com a API

Servicos HTTP implementados:

- `auth.service`
- `attendance.service`
- `analytics.service`
- `admin-users.service`
- `workout.service`
- `notifications.service`
- `exercise-help.service`
- `user-profile.service`

Todos os fluxos de negocio dependem da API em `apps/api`.

## Deploy (Vercel)

Configuracao recomendada:

1. Root directory: `apps/web`
2. Install command: `npm install`
3. Build command: `npm run build`
4. Framework preset: Angular (ou Other)
5. Rewrite SPA: usar `vercel.json` (ja presente) para redirecionar para `index.html`

Apos publicar:

- confirmar CORS no backend (`FRONTEND_URLS`)
- validar login, dashboard, admin e check-in em ambiente real

## Credenciais para validacao manual (seed da API)

- Admin: `admin@siga.com.br` / `siga123`
- Aluno: `aluno1@siga.com.br` / `siga123`
