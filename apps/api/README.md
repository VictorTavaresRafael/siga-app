# SIGA API (Backend)

Backend em NestJS + Prisma + PostgreSQL.

## Requisitos
- Node.js 18+
- npm 9+
- PostgreSQL

## Setup local
```
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```
Swagger: http://localhost:3333/api

## Variaveis de ambiente
Crie `.env` com:
```
DATABASE_URL=postgresql://user:pass@localhost:5432/siga
JWT_SECRET=changeme
FRONTEND_URLS=http://localhost:4200
PORT=3333
EXERCISEDB_RAPIDAPI_KEY=sua_chave_rapidapi
EXERCISEDB_RAPIDAPI_HOST=exercisedb.p.rapidapi.com
EXERCISEDB_BASE_URL=https://exercisedb.p.rapidapi.com
EXERCISEDB_TIMEOUT_MS=9000
EXERCISEDB_CACHE_TTL_MS=600000
```

## Scripts
- `npm run start:dev` - dev server
- `npm run build` - build
- `npm start` - run build

## Seguranca basica
- Helmet (headers de seguranca)
- Rate limit (janela de 15 min, 300 req)
- JWT + RBAC

## Endpoints principais
- `POST /auth/login`
- `POST /attendance/check-in`
- `GET /attendance/me/today`
- `GET /analytics/export`
- `GET /users/students`
- `POST /workouts`
- `PUT /workouts/:id`
- `POST /notifications`
- `GET /exercise-help?name=supino`

## Deploy
- Configure `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URLS` no ambiente.
- Rode `npx prisma migrate deploy` no ambiente de producao.

## Seed
- admin@siga.com.br / siga123
- aluno@teste.com / siga123
