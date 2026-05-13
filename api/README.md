<p align="center">
  <a href="https://nestjs.com/" target="_blank" rel="noopener noreferrer"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="NestJS" /></a>
</p>

# API — Teste Info Sistemas

Backend **NestJS 11** (TypeScript): CRUD de veículos em **PostgreSQL** via **Prisma**, rotas de veículos versionadas na URI (**`/v1/vehicles`**), eventos de domínio em **RabbitMQ** e erros em **Sentry**. O processo HTTP e os consumidores de fila rodam no **mesmo** binário (`main.ts`).

## Stack (em uso no código)

| Tecnologia | Uso |
|------------|-----|
| NestJS 11 | HTTP, DI, módulos |
| Prisma + `pg` + `@prisma/adapter-pg` | ORM e pool PostgreSQL |
| `@golevelup/nestjs-rabbitmq` | Publicação e consumo AMQP |
| `@nestjs/swagger` | OpenAPI (somente fora de `production`) |
| `@sentry/nestjs` | Erros não tratados (`SENTRY_DSN`) |
| `@nestjs/schedule` | Agendamento (módulo de jobs vazio no momento) |
| class-validator / class-transformer | DTOs e validação de env em `config/env.schema.ts` |

Dependências como **Redis** (`@nestjs-modules/ioredis`) podem existir no `package.json`, mas **não há módulo Redis registrado** em `src/` neste projeto.

## Arquitetura (visão rápida)

```
                    ┌─────────────────────────────────────────────────────────┐
                    │        API NestJS — processo único (PORT / main.ts)     │
                    │                                                         │
  Cliente ─────────►│  CORS → body-parser → ValidationPipe → LogInterceptor   │
                    │       → Controllers → Services → PrismaService          │
                    │       → WorkersModule → VehicleEventsWorker             │
                    │  Sentry + Swagger UI apenas fora de production          │
                    └────────────────────────────┬────────────────────────────┘
                                                 │
              ┌──────────────────────────────────┼──────────────────────────────────┐
              │                                  │                                  │
              ▼                                  ▼                                  ▼
     [PostgreSQL]                       [RabbitMQ]                         [Sentry]
     Prisma + pg pool                   vehicle.events                      cloud
     DATABASE_URL                       + DLX / DLQ                         (opcional)
```

## Diagramas de caso de uso

Diagramas em **ASCII** (monoespaçado). Os casos seguem `src/modules` e `src/workers`.

### Ator: cliente HTTP (REST)

O ator representa qualquer consumidor da API (SPA, mobile, outro serviço, Postman, etc.).

```
                    ┌─────────────────────────────────────────────────────────┐
                    │              Casos de uso — superfície REST             │
                    │                                                         │
  Cliente ─────────►│  UC1  GET    /ping              — disponibilidade       │
                    │  UC2  POST   /v1/vehicles       — cadastrar             │
                    │  UC3  GET    /v1/vehicles       — listar / buscar       │
                    │  UC4  GET    /v1/vehicles/:id   — detalhar              │
                    │  UC5  PATCH  /v1/vehicles/:id   — atualizar             │
                    │  UC6  DELETE /v1/vehicles/:id   — remover (204)         │
                    └─────────────────────────────────────────────────────────┘
```

### Sistema: eventos de domínio e fila

O **mesmo** processo NestJS publica na fila e consome com o worker. Gatilhos: mutações **UC2**, **UC5** e **UC6** após persistência bem-sucedida.

```
     UC2 / UC5 / UC6 (HTTP OK, veículo gravado ou removido no PostgreSQL)
                    │
                    ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │  UC7  VehiclesService → RabbitMQService.publishToQueue   │
                    │       fila: vehicle.events  (created | updated | deleted) │
                    └────────────────────────────┬────────────────────────────┘
                                                 │
                                                 ▼
                                    ┌─────────────────────────┐
                                    │   RabbitMQ              │
                                    │   fila vehicle.events   │
                                    └────────────┬────────────┘
                                                 │
                    ┌────────────────────────────┴────────────────────────────┐
                    │                                                         │
                    ▼                                                         ▼
         ┌──────────────────────────┐                            (payload inválido)
         │  UC8  VehicleEventsWorker │                            ACK → descarta
         │  consome e processa       │                            (não vai à DLQ)
         └────────────┬──────────────┘
                      │
         ┌────────────┴────────────┐
         │                         │
         ▼                         ▼
   (processamento OK)      (exceção no handler)
   logs debug/info         NACK → DLX → [vehicle.events.dlq]
```

**Notas:** a publicação **UC7** não bloqueia a resposta HTTP; falha ao publicar só aparece em **log**. Mensagens malformadas: **ACK** e descarte. Exceção no handler: **NACK** e roteamento para **DLQ** via dead-letter do broker.

## Estrutura relevante em `src/`

```
src/
├── main.ts                 # Bootstrap, pipes globais, Swagger (não-prod)
├── instrument.ts           # Sentry.init — importado antes do Nest em main.ts
├── app.module.ts           # Config, RabbitMQ, Schedule, Prisma, rotas, workers
├── config/                 # env.schema + configuration
├── common/
│   ├── constants/          # VEHICLES_API_VERSION (`v1` na URI)
│   ├── prisma/
│   ├── rabbitmq/           # filas DLX/DLQ, RabbitMQService
│   ├── filters/            # erros Prisma → HTTP
│   └── utils/              # logger customizado
├── interceptors/           # ex.: log de tempo por request
├── modules/
│   ├── ping/               # GET /ping
│   └── vehicles/           # CRUD /v1/vehicles + eventos de domínio
└── workers/
    ├── queues/             # VehicleEventsWorker
    └── jobs/               # JobsModule (sem jobs registrados ainda)
```

## Pré-requisitos

- **Node.js** (LTS recomendado)
- **PostgreSQL** e `DATABASE_URL` válida para Prisma
- **RabbitMQ** (opcional): sem `RABBITMQ_URL` nem `HOST`+`PORT`+`USER`+`PASSWORD`, o app sobe em modo **sem conexão AMQP** (`RabbitMQService` no-op com aviso único no log)

## Variáveis de ambiente

Ordem de carregamento: `.env.local`, depois `.env` (`ConfigModule`). Valores numéricos de `PORT` e enum de `NODE_ENV` são validados em `config/env.schema.ts` no startup.

| Variável | Obrigatório | Descrição |
|----------|-------------|-----------|
| `NODE_ENV` | Não | `development` \| `production` \| `test` (default: `development`) |
| `PORT` | Não | Porta HTTP, 1–65535 (default: `3000`) |
| `DATABASE_URL` | Sim* | URL PostgreSQL para o Prisma Client |
| `SENTRY_DSN` | Não | Se vazio, Sentry fica desligado (`instrument.ts`) |
| `RABBITMQ_URL` | Não** | URL AMQP única |
| `RABBITMQ_HOST` / `PORT` / `USER` / `PASSWORD` | Não** | Montagem da URL se não houver `RABBITMQ_URL` |
| `RABBITMQ_VHOST` | Não | Virtual host (default `/` na montagem da URL) |
| `CRON_TIME_ZONE` | Não | Timezone para crons futuros (`@nestjs/schedule`) |
| `LOG_LEVEL` | Não | Usado pelo `CustomLogger` (ex.: `debug`, `warn`); **não** está no `EnvSchema` |

\* Sem `DATABASE_URL`, operações Prisma falham em runtime.  
\** Ou URL completa ou o conjunto host/porta/usuário/senha. Sem nenhum, sem AMQP.

## Banco de dados (Prisma)

Modelo atual: entidade **Vehicle** (`prisma/schema.prisma`) — campos únicos: `placa`, `chassi`, `renavam`; PK `id` UUID v7.

```bash
npm install
npm run prisma:generate   # também roda em start:dev / build
npm run prisma:migrate    # dev: cria/aplica migrations
npm run prisma:push       # sincroniza schema sem migration (protótipo)
```

## Executar

```bash
npm run start:dev    # prisma generate + nest --watch
npm run start        # uma execução
npm run start:debug
npm run build && npm run start:prod
```

Base URL: `http://localhost:${PORT}` (default `3000`).

## Versionamento da API

Os recursos de **veículos** expõem **versão na URI** (`/v1/...`), usando `app.enableVersioning({ type: VersioningType.URI, prefix: 'v' })` em `main.ts` e `VEHICLES_API_VERSION` em `src/common/constants/api-version.ts` (valor atual: **`1`** → prefixo **`v1`**).

| Superfície | Caminho | Observação |
|------------|---------|------------|
| Health | `GET /ping` | **Sem** segmento de versão (adequado a probes de load balancer). |
| Veículos | `POST/GET /v1/vehicles`, `GET/PATCH/DELETE /v1/vehicles/:id` | CRUD e paginação; OpenAPI/Swagger lista esses paths. |

Rotas antigas sem prefixo (`/vehicles`, …) **não** são atendidas. Para uma **v2** futura: outro valor em `VEHICLES_API_VERSION` ou `version: ['1','2']` no controller, conforme [versionamento NestJS](https://docs.nestjs.com/techniques/versioning).

## API HTTP

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/ping` | Health check — retorna o texto `pong` |
| `POST` | `/v1/vehicles` | Cria veículo; publica evento `created` na fila (se AMQP ativo) |
| `GET` | `/v1/vehicles` | Lista paginada; query `page`, `limit`, `search` (placa/modelo/marca) |
| `GET` | `/v1/vehicles/:id` | Detalhe por UUID |
| `PATCH` | `/v1/vehicles/:id` | Atualização parcial; evento `updated` |
| `DELETE` | `/v1/vehicles/:id` | Remoção; evento `deleted` — resposta **204** sem corpo |

Erros de validação: corpo/query inválidos → **400**. Unicidade Prisma (`P2002`) → **409** via filtro global. Registro inexistente (`P2025` / `NotFoundException`) → **404**.

## OpenAPI (Swagger)

Com `NODE_ENV !== production`:

- UI: `/docs`
- JSON: `/docs-json`
- Os paths de veículos aparecem como `/v1/vehicles`, … (alinhados ao versionamento por URI).

Em produção esses endpoints **não** são registrados.

## RabbitMQ

- **Fila principal:** `vehicle.events` (FIFO, durable), com **DLX** `vehicle.events.dlx` e **DLQ** `vehicle.events.dlq`.
- **Publicação:** `VehiclesService` chama `RabbitMQService.publishToQueue('vehicle.events', payload)` após create/update/delete. Falha na publicação só gera **log** (não altera a resposta HTTP).
- **Consumo:** `VehicleEventsWorker` — mensagens JSON inválidas ou sem campos obrigatórios são **ACK** e descartadas; falhas de processamento com exceção → **NACK** → DLQ.

Exemplo de payload (domínio):

```json
{
  "eventType": "created",
  "occurredAt": "2026-05-13T12:00:00.000Z",
  "vehicle": {
    "id": "…",
    "placa": "ABC1D23",
    "chassi": "9BWZZZ377VT004251",
    "renavam": "12345678901",
    "modelo": "Gol 1.0",
    "marca": "VW",
    "ano": 2024,
    "createdAt": "…",
    "updatedAt": "…"
  }
}
```

## Observabilidade

- **Sentry:** `src/instrument.ts` + `SentryModule` / `SentryGlobalFilter` em `app.module.ts`.
- **Logs HTTP:** `LogHttpInterceptor` em `main.ts` (tempo por rota).

## Testes e qualidade

```bash
npm run test
npm run test:e2e
npm run test:cov
npm run lint
npm run format
```

## Scripts npm (referência)

| Script | Notas |
|--------|--------|
| `build` | `prisma generate` + `nest build` |
| `start:dev` | `prisma generate` + watch |
| `start:prod` | `node dist/main` após build |

Demais scripts: ver `package.json` (`prisma:*`, `test:*`, etc.).

## Licença

UNLICENSED (projeto privado).
