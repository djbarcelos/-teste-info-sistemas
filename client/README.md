# Cliente — Veículos (Angular 19)

SPA para **listagem**, **cadastro**, **detalhe** e **edição** de veículos, consumindo a API REST em **`/v1/vehicles`** (mesmo contrato do `VehiclesController` Nest).

## Como rodar

1. Suba a API (pasta `../api`), por exemplo: `npm run start:dev` na porta **3000**.
2. Nesta pasta:

```bash
npm install
npm start
# equivalente:
npm run start:dev
```

Abra `http://localhost:4200`. A URL base da API está em `src/environments/environment.ts` (`apiBaseUrl`). Para produção, ajuste `src/environments/environment.prod.ts` (substituído no build de produção via `angular.json`).

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm start` | `ng serve` (desenvolvimento) |
| `npm run build` | Build de produção |
| `npm test` | Testes unitários (Karma + Jasmine) |

## Estrutura

- `src/app/services/vehicle.service.ts` — chamadas HTTP para `GET/POST/PATCH/DELETE` em `/v1/vehicles`.
- `src/app/pages/vehicle-list` — listagem com busca, paginação e links para detalhe/edição.
- `src/app/pages/vehicle-detail` — leitura e exclusão (`DELETE` → 204).
- `src/app/pages/vehicle-form` — criação (`POST`) e edição (`PATCH`).

## CORS

A API habilita CORS globalmente (`api/src/main.ts`), permitindo chamadas do `ng serve` em outra origem.
