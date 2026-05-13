# Cliente — Veículos (Angular 19)

SPA com visual inspirado no **Human Interface Guidelines** (Apple): tipografia de sistema, materiais com blur, listas agrupadas e ações em estilo iOS.

Consumo da API em **`/v1/vehicles`** (mesmo contrato do `VehiclesController` Nest).

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

## Funcionalidades

- **Listagem:** busca (com debounce), paginação, linhas estilo lista iOS.
- **Novo veículo:** **modal** (botão “Novo veículo” ou menu **Novo** com `?criar=1`). Ano em **select** de **1900** até **ano corrente + 1** (ex.: 2026 → opções até **2027**).
- **Detalhe / edição:** telas dedicadas; edição com o mesmo select de ano.

## Estrutura

- `src/app/services/vehicle.service.ts` — HTTP `GET/POST/PATCH/DELETE` em `/v1/vehicles`.
- `src/app/components/vehicle-create-modal` — modal de cadastro (`POST`).
- `src/app/utils/vehicle-years.ts` — opções de ano alinhadas à API.
- `src/app/pages/vehicle-list` — lista + abertura do modal.
- `src/app/pages/vehicle-detail` — leitura e exclusão (`DELETE` → 204).
- `src/app/pages/vehicle-form` — edição (`PATCH`).

## CORS

A API habilita CORS globalmente (`api/src/main.ts`), permitindo chamadas do `ng serve` em outra origem.
