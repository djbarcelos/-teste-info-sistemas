# Cliente — Veículos (Angular 19)

Documentação técnica do **frontend** da aplicação de frota: SPA em Angular 19 (standalone), com visual inspirado no **Human Interface Guidelines** (Apple): tipografia de sistema, materiais com blur, listas agrupadas e ações em estilo iOS.

## Stack e arquitetura

| Camada | Detalhes |
|--------|----------|
| Framework | Angular 19, componentes **standalone** (`standalone: true`), rotas declaradas em `app.routes.ts`. |
| HTTP | `HttpClient` (fornecido em `app.config.ts` com `provideHttpClient()`). |
| Formulários | `ReactiveFormsModule` nos modais de formulário. |
| Estilo | SCSS por componente + tokens globais em `src/styles.scss` (variáveis `--apple-*`). |

Fluxo de dados: a **única página funcional** é a listagem (`VehicleListComponent`), que orquestra modais e chama `VehicleService` para a API Nest em **`/v1/vehicles`** (contrato alinhado ao `VehiclesController`).

## Como rodar

1. Suba a API (pasta `../api`), por exemplo: `npm run start:dev` na porta **3000**.
2. Nesta pasta:

```bash
npm install
npm start
# equivalente:
npm run start:dev
```

Abra `http://localhost:4200`. A URL base da API está em `src/environments/environment.ts` (`apiBaseUrl`). Para produção, ajuste `src/environments/environment.prod.ts` (substituído no build de produção via `fileReplacements` em `angular.json`).

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm start` | `ng serve` (desenvolvimento) |
| `npm run build` | Build de produção |
| `npm test` | Testes unitários (Karma + Jasmine) |

## Rotas (`src/app/app.routes.ts`)

| Rota | Comportamento |
|------|----------------|
| `''` | Redireciona para `vehicles`. |
| `vehicles` | `VehicleListComponent` — listagem e modais. |
| `vehicles/new` | Redireciona para `/vehicles`. |
| `vehicles/:id`, `vehicles/:id/edit` | Redirecionam para `/vehicles` (URLs antigas ou bookmarks não quebram o app). |
| `**` | Redireciona para `vehicles`. |

Não há lazy loading: o bundle inicial carrega a lista e os modais referenciados por ela.

## Contrato com a API

O cliente consome os mesmos endpoints do backend Nest:

| Método | Caminho | Uso no cliente |
|--------|---------|----------------|
| `GET` | `/v1/vehicles` | Listagem com query `page`, `limit`, `search` opcional. |
| `GET` | `/v1/vehicles/:id` | Detalhe no modal e carga do formulário de edição. |
| `POST` | `/v1/vehicles` | Criação (modal de formulário, modo `create`). |
| `PATCH` | `/v1/vehicles/:id` | Atualização (modal de formulário, modo `edit`). |
| `DELETE` | `/v1/vehicles/:id` | Exclusão (menu da lista ou modal de detalhe). |

Tipos TypeScript: `src/app/models/vehicle.model.ts` (`Vehicle`, `PaginatedVehicles`, `CreateVehiclePayload`, `UpdateVehiclePayload`).

## Funcionalidades (comportamento)

- **Listagem:** busca com debounce (~400 ms), paginação, contagem e estado de carregamento/erro.
- **Menu por linha (···):** ações **Visualizar** (modal somente leitura), **Editar** (modal de formulário), **Excluir** (confirmação nativa + `DELETE` + atualização da lista). Clique fora fecha o menu (`document:click`); o botão do menu usa `stopPropagation` para não fechar ao alternar.
- **Novo veículo:** modal de formulário (`mode: 'create'`). Atalho pelo header: link com query **`?criar=1`** — a lista consome o parâmetro, abre o modal e remove a query da URL (`replaceUrl`).
- **Visualizar:** `VehicleDetailModalComponent` — dados, datas formatadas com `DatePipe`, ações Editar / Excluir no próprio modal.
- **Editar:** mesmo modal de formulário que a criação (`VehicleFormModalComponent`, `mode: 'edit'`), com `GET` prévio para preencher o formulário e `PATCH` ao salvar.
- **Ano do modelo:** `select` populado por `vehicleYearChoices()` em `src/app/utils/vehicle-years.ts` — anos **1900** a **ano corrente + 1**, ordem crescente; ano padrão sugerido em novo cadastro: `defaultVehicleModelYear()` (ano civil atual).

## Estrutura de pastas (relevante)

```
src/app/
├── app.component.*          # Shell (marca, nav, router-outlet)
├── app.config.ts            # providers (router, HttpClient)
├── app.routes.ts
├── models/vehicle.model.ts
├── services/vehicle.service.ts
├── utils/vehicle-years.ts
├── components/
│   ├── vehicle-form-modal/  # Criar + editar (POST / PATCH)
│   └── vehicle-detail-modal/ # Leitura + excluir / disparar edição
└── pages/
    └── vehicle-list/        # Lista, menu de ações, orquestração dos modais
```

### `VehicleService`

Injectable `providedIn: 'root'`. Base URL: `environment.apiBaseUrl` normalizada (sem barra final) + `/v1/vehicles`. Métodos: `list`, `getById`, `create`, `update`, `delete`.

### `VehicleFormModalComponent`

| Input | Descrição |
|-------|-----------|
| `open` | Controla visibilidade do modal. |
| `mode` | `'create' \| 'edit'`. |
| `vehicleId` | Obrigatório em modo `edit` (UUID do veículo). |

| Output | Descrição |
|--------|-----------|
| `openChange` | `boolean` — fechar modal (Cancelar, backdrop, Escape). |
| `saved` | Emitido após sucesso de `POST` ou `PATCH`. |

Validação: placa (7–10 caracteres), chassi (17 caracteres), demais campos alinhados ao uso anterior. Escape fecha o modal; durante envio ou carregamento do veículo em edição o fechamento é restrito conforme implementação.

### `VehicleDetailModalComponent`

| Input | Descrição |
|-------|-----------|
| `open` | Visibilidade do modal. |
| `vehicleId` | ID para `GET` ao abrir. |

| Output | Descrição |
|--------|-----------|
| `openChange` | Fechar modal. |
| `deleted` | Após `DELETE` com sucesso. |
| `editRequested` | Emite o `id` para a lista abrir o modal de edição. |

### `VehicleListComponent`

Centraliza estado dos modais (`formModalOpen`, `formModalMode`, `formModalVehicleId`, `detailModalOpen`, `detailVehicleId`) e do menu (`openMenuVehicleId`). Reage a `ActivatedRoute.queryParams` para `criar=1`.

## Ambiente e CORS

- **Ambiente:** `src/environments/environment.ts` (dev) e `environment.prod.ts` (build prod).
- **CORS:** a API habilita CORS globalmente (`api/src/main.ts`), permitindo chamadas do `ng serve` em outra origem.

## Testes

Especificações ao lado dos artefatos: `vehicle.service.spec.ts`, `app.component.spec.ts`. Comando: `npm test`.
