# SIGA Web (Frontend)

Frontend em Angular (Standalone Components) com Angular Material e RxJS.

## Requisitos
- Node.js 18+
- npm 9+

## Setup local
```
npm install
npm start
```
App: http://localhost:4200

## Variaveis de ambiente
A API base esta em `apps/web/src/environments/environment*.ts`.
- Dev: `environment.development.ts`
- Producao: `environment.ts`

Atualize `apiUrl` para a URL do backend deployado.

## Scripts
- `npm start` - dev server
- `npm run build` - build de producao
- `npm test` - testes

## Deploy (Vercel)
1. Crie um projeto na Vercel apontando para `apps/web`.
2. Build command: `npm run build`
3. Output: `dist/web` (ou o diretorio gerado pelo Angular build).
4. Atualize `environment.ts` com a URL do backend antes do build.

## Credenciais de seed (backend)
- admin@siga.com.br / siga123
- aluno@teste.com / siga123
