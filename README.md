# SIGA - Sistema Integrado de Gestao de Academia

SIGA e uma aplicacao full stack para operacao de academia, com autenticacao JWT, controle de acesso por perfil, check-in diario por QR Code, gestao de alunos e treinos, notificacoes e analiticos com exportacao CSV.

## Objetivo do projeto

Este projeto foi construido para demonstrar capacidade de entregar software completo, com foco em:

- arquitetura modular no backend e frontend
- seguranca baseline para aplicacao web real
- experiencia do usuario orientada por perfil (ADMIN e STUDENT)
- documentacao e setup reproduzivel para avaliacao tecnica

## Arquitetura

- `apps/web`: frontend Angular 21 (standalone components, Angular Material, RxJS, Chart.js).
- `apps/api`: backend NestJS 11 com Prisma ORM e PostgreSQL.
- CI: pipeline no GitHub Actions para build de `web` e `api` em push/PR.

## Principais funcionalidades

- Login com JWT e segregacao por perfil (`ADMIN`, `STUDENT`).
- Check-in diario por QR Code (codigo no formato `SIGA-YYYY-MM-DD`).
- Gestao de alunos (cadastro, atualizacao, perfil e desativacao).
- Gestao de treinos por aluno, com exercicios estruturados.
- Painel de analytics com series e exportacao CSV.
- Canal de notificacoes aluno -> administracao com resposta.
- Consulta assistida de exercicios via API externa.

## Como executar localmente

### 1) API (`apps/api`)

```bash
cd apps/api
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

API e Swagger: `http://localhost:3333` e `http://localhost:3333/api`

### 2) Web (`apps/web`)

```bash
cd apps/web
npm install
npm start
```

Web local: `http://localhost:4200`

## Credenciais de seed

- Admin: `admin@siga.com.br` / `siga123`
- Aluno exemplo: `aluno1@siga.com.br` / `siga123`

## Documentacao detalhada

- Backend: `apps/api/README.md`
- Frontend: `apps/web/README.md`
