# Teste Info Sistemas

Monorepo com **API NestJS** (`api/`) e **cliente Angular 19** (`client/`).

## Requisitos

- Node.js LTS  
- PostgreSQL (API)  
- Opcional: RabbitMQ (eventos)

## API

Ver [api/README.md](api/README.md).

```bash
cd api && npm install && npm run start:dev
```

Padrão: `http://localhost:3000` — endpoints de veículos em `/v1/vehicles`.

## Cliente (Angular)

Ver [client/README.md](client/README.md).

```bash
cd client && npm install && npm run start:dev
```

Padrão: `http://localhost:4200` — consome a API acima (`environment.apiBaseUrl`).
