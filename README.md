# Teste Info Sistemas

Monorepo com **API NestJS** (`api/`) e **cliente Angular 19** (`client/`): CRUD de veículos, PostgreSQL, filas RabbitMQ e SPA consumindo `/v1/vehicles`.

## Stack

| Camada | Tecnologias |
|--------|-------------|
| **API** | NestJS 11, TypeScript, Prisma 7 + adapter `pg`, PostgreSQL, RabbitMQ (`@golevelup/nestjs-rabbitmq`), validação (class-validator / class-transformer), Swagger (fora de produção), Sentry (opcional), `@nestjs/schedule` |
| **Cliente** | Angular 19 (standalone), TypeScript, SCSS, `HttpClient`, rotas em `app.routes.ts` |
| **Dados** | Modelo **Vehicle** (Prisma): placa, chassi, renavam únicos; eventos de domínio na fila `vehicle.events` |
| **Infra (Compose)** | PostgreSQL 16, RabbitMQ 3.13 (management), imagens **api** e **client** (Nginx servindo o build Angular) |

Detalhes de arquitetura, variáveis de ambiente e casos de uso: [api/README.md](api/README.md) e [client/README.md](client/README.md).

## Requisitos

- **Start único (recomendado):** [Docker](https://docs.docker.com/get-docker/) (Engine ou Desktop) com Compose v2.
- **Desenvolvimento só com Node:** Node.js **LTS**, PostgreSQL e (opcional) RabbitMQ — ver seções abaixo.

## Start único

Na raiz do repositório, sobe **Postgres**, **RabbitMQ**, **API** (migrações + seed conforme `docker-compose`) e **cliente** em Nginx:

```bash
npm start
```

Equivalente:

```bash
docker compose up --build
```

Em segundo plano:

```bash
npm run start:detached
```

| Serviço | URL / porta |
|---------|-------------|
| API | [http://localhost:3000](http://localhost:3000) — veículos em `/v1/vehicles`, health em `/ping` |
| Cliente | [http://localhost:4200](http://localhost:4200) |
| RabbitMQ (broker) | Uso interno ao Compose; credenciais padrão no [docker-compose.yml](docker-compose.yml) |

Para parar: `Ctrl+C` (foreground) ou `docker compose down`.

## Desenvolvimento local (sem Docker da aplicação)

1. Suba PostgreSQL (e RabbitMQ, se quiser filas reais) — pode usar só os serviços de dados: `docker compose up postgres rabbitmq -d` na raiz.
2. Configure `DATABASE_URL` (e demais variáveis) em `api/` — ver [api/README.md](api/README.md).
3. API:

```bash
cd api && npm install && npm run start:dev
```

4. Cliente (outro terminal); em `client/src/environments/environment.ts`, defina `apiBaseUrl` com a URL da API (padrão `http://localhost:3000`):

```bash
cd client && npm install && npm run start:dev
```

Padrões: API `http://localhost:3000`, cliente `http://localhost:4200`.

## Estrutura

```
api/           # NestJS + Prisma
client/        # Angular 19
docker-compose.yml   # orquestração do start único
```
