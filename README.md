# RT HELPDESK

Sistema web interno para gestão da equipe de suporte e implantação de sistemas ERP. Centraliza chamados, agenda, clientes, equipe e indicadores de produtividade.

> **Etapa atual: Etapa 12.** Todos os módulos da especificação original estão implementados: Fundação, **Chamados**, **integração real com o TotalChat**, **Clientes** (com importação/exportação CSV e exclusão), **Agenda**, **Equipe** (usuários + produtividade, com exclusão), **Relatórios** (filtros, gráficos e exportação CSV/PDF), **Notificações** (central no header, por polling) e **Base de Conhecimento** (conectada à API real do site Gestão). Além disso: **logo customizável** (Configurações → Identidade visual, refletida na Sidebar e na tela de login) e **autoatendimento de perfil** (menu "Meu perfil": upload de foto, edição de dados e troca de senha). O que resta é evolução: atribuição automática via TotalChat e exportação de relatórios em Excel.

---

## Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui (componentes Radix), React Router, TanStack Query, Lucide Icons, Recharts, FullCalendar, @dnd-kit, jsPDF.

**Backend:** Node.js, TypeScript, Express, JWT, bcrypt, Zod.

**Banco de dados:** PostgreSQL + Prisma ORM.

**Infra:** Docker, Docker Compose, ESLint, Prettier.

---

## Estrutura do projeto

```text
rt-helpdesk/
├── frontend/           # SPA React (Vite)
│   └── src/
│       ├── components/ # Componentes reutilizáveis (inclui ui/ no padrão shadcn)
│       ├── layouts/    # Sidebar, Header, AppLayout
│       ├── pages/      # Páginas roteadas
│       ├── hooks/      # Hooks (TanStack Query, toast, etc.)
│       ├── services/   # Clientes HTTP para a API
│       ├── contexts/   # Auth e Theme
│       ├── types/      # Tipos compartilhados
│       └── utils/
├── backend/             # API REST Express
│   └── src/
│       ├── controllers/
│       ├── services/
│       ├── repositories/
│       ├── routes/
│       ├── middlewares/
│       ├── integrations/
│       │   ├── totalchat/       # Integração real (client + polling) — ver seção abaixo
│       │   └── knowledge-base/  # Dados mockados até a API real ser fornecida
│       └── utils/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── docker-compose.yml
├── .env.example
└── package.json          # Workspace raiz (npm workspaces)
```

---

## Como instalar

### Pré-requisitos

- Node.js 20+
- PostgreSQL 16+ (local ou via Docker)
- Docker + Docker Compose (opcional, para rodar tudo containerizado)

### 1. Variáveis de ambiente

```bash
cp .env.example .env
```

Ajuste `DATABASE_URL`, `JWT_SECRET` e demais valores conforme necessário.

### 2. Instalar dependências (workspace raiz)

```bash
npm install
```

Isso instala as dependências de `backend/` e `frontend/` via npm workspaces.

### 3. Banco de dados

Suba o PostgreSQL (via Docker, por exemplo):

```bash
docker compose up -d postgres
```

Rode as migrations e o seed:

```bash
npm run prisma:migrate
npm run seed
```

### 4. Rodar em desenvolvimento

Em dois terminais:

```bash
npm run dev:backend    # API em http://localhost:3333
npm run dev:frontend   # Frontend em http://localhost:5173
```

### Alternativa: tudo via Docker Compose

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3333
- PostgreSQL: localhost:5432

Depois de subir os containers, rode as migrations/seed uma vez:

```bash
docker compose exec backend npm run prisma:deploy
docker compose exec backend npm run seed
```

---

## Credenciais de teste

Após rodar o seed:

| Usuário | E-mail | Senha | Papel |
|---|---|---|---|
| Ana Souza | ana.souza@rthelpdesk.com | 123456 | Administrador |
| Carlos Lima | carlos.lima@rthelpdesk.com | 123456 | Gerente |
| João Pereira | joao.pereira@rthelpdesk.com | 123456 | Suporte |
| Maria Fernandes | maria.fernandes@rthelpdesk.com | 123456 | Implantação |
| Pedro Alves | pedro.alves@rthelpdesk.com | 123456 | Suporte |
| Filipe Rodrigues | filiperodrigueshomework@gmail.com | 140204 | Administrador |

---

## Rotas existentes (API)

Todas as rotas (exceto `/auth/login`) exigem header `Authorization: Bearer <token>`.

```text
POST   /api/auth/login
GET    /api/auth/me

GET    /api/users
POST   /api/users
PATCH  /api/users/:id
DELETE /api/users/:id                 (exclusão definitiva — bloqueada para o próprio usuário logado)
PATCH  /api/users/me                  (autoatendimento: nome/e-mail/cargo e, opcionalmente, troca de senha)
POST   /api/users/me/avatar           (multipart/form-data, campo "file" — upload da própria foto)

GET    /api/roles                     (papéis disponíveis, para formulários)

GET    /api/settings/logo             (pública — necessária na tela de login antes do usuário autenticar)
POST   /api/settings/logo             (multipart/form-data, campo "file" — Administrador/Gerente)
DELETE /api/settings/logo             (restaura a logo padrão — Administrador/Gerente)

GET    /api/integrations/totalchat/attendants  (atendentes reais do TotalChat, para vincular a um usuário)

GET    /api/dashboard/summary

GET    /api/customers                 (lista paginada, com busca)
GET    /api/customers/minimal         (lista leve — para uso em formulários)
POST   /api/customers
GET    /api/customers/:id             (com indicadores, chamados recentes, agenda, responsáveis)
PATCH  /api/customers/:id
DELETE /api/customers/:id             (bloqueada se o cliente tiver chamados vinculados)
POST   /api/customers/import          (importação em lote via CSV — máx. 500 linhas por vez)

GET    /api/categories
GET    /api/tags

GET    /api/appointments?start=&end=  (eventos da agenda no período)
POST   /api/appointments
GET    /api/appointments/:id
PATCH  /api/appointments/:id
DELETE /api/appointments/:id

GET    /api/reports/summary           (totais, SLA, por cliente/categoria/atendente — mesmos filtros dos chamados)
GET    /api/reports/tickets           (lista para exportação CSV)

GET    /api/notifications             (mais recentes do usuário logado)
GET    /api/notifications/unread-count
POST   /api/notifications/:id/read
POST   /api/notifications/read-all

GET    /api/tickets                   (filtros, ordenação, paginação)
GET    /api/tickets/board             (todos os chamados, para o Kanban)
POST   /api/tickets
GET    /api/tickets/:id
PATCH  /api/tickets/:id
PATCH  /api/tickets/:id/status
POST   /api/tickets/:id/resolve       (problema/causa raiz/solução — status Resolvido/Encerrado)
POST   /api/tickets/:id/comments
POST   /api/tickets/:id/attachments   (multipart/form-data)

GET    /api/integrations
POST   /api/integrations/totalchat/test    (testa login — sem efeitos colaterais)
POST   /api/integrations/totalchat/sync    (sincronização manual — ver aviso na seção TotalChat)

GET    /api/knowledge-base            (?q= para pesquisa — dados mockados)
```

## Rotas do frontend

```text
/login
/                        Dashboard
/chamados                Lista e Kanban de chamados
/chamados/novo           Criação de chamado
/chamados/:id            Detalhe do chamado
/agenda                  Calendário (dia/semana/mês), criar/editar/excluir/arrastar/redimensionar eventos
/clientes                Lista e busca de clientes, com importação e exportação CSV
/clientes/novo           Cadastro de cliente
/clientes/:id            Detalhe do cliente (indicadores, chamados, agenda, responsáveis)
/clientes/:id/editar     Edição de cliente, com opção de excluir o cadastro (bloqueada se houver chamados vinculados)
/base-de-conhecimento    Consulta a artigos (dados mockados)
/equipe                  Gerenciamento de usuários (criar/editar/ativar/desativar/excluir) + métricas de produtividade
/relatorios              Filtros (período/cliente/responsável/categoria/prioridade/status), gráficos e exportação CSV/PDF
/configuracoes           Identidade visual (logo customizável) + status das integrações + testar/sincronizar TotalChat
```

Menu do usuário (canto inferior da Sidebar) → **Meu perfil**: upload de foto, edição de nome/e-mail/cargo e troca de senha.

---

## Estrutura do banco (Prisma)

Modelos criados: `User`, `Role`, `Permission`, `Customer`, `CustomerContact`, `Ticket`, `TicketComment`, `TicketHistory`, `TicketAttachment`, `Tag`, `TicketTag`, `Category`, `Appointment`, `SlaRule`, `Notification`, `Integration`.

Todos os modelos usam UUID como chave primária e possuem `createdAt`/`updatedAt`. O schema já contempla os campos estruturais para a futura integração com o TotalChat (`totalchatConversationId`, `totalchatContactId`, etc.), mas nenhum valor é preenchido até a integração real ser implementada.

Os valores de SLA (`SlaRule`) são configuráveis via banco, não fixos no código:

```text
Baixa    → 48 horas
Normal   → 24 horas
Alta     → 8 horas
Crítica  → 2 horas
```

---

## Notificações

Central de notificações real no header (sininho com contador de não lidas). Eventos cobertos, conforme a especificação original:

- Chamado atribuído / responsável alterado — disparado ao criar ou reatribuir um chamado.
- Menção em comentário — detecta `@Nome` ou `@Nome Sobrenome` no texto do comentário e casa com usuários ativos.
- Chamado atualizado — disparado em mudanças de status, prioridade ou categoria.
- SLA próximo do vencimento / SLA vencido — job periódico (`backend/src/jobs/notificationJobs.ts`, a cada 5 min) verifica chamados abertos com SLA vencendo em até 1h ou já vencido.
- Evento da agenda próximo — mesmo job, verifica eventos começando em até 30 min.

**Não é tempo real via WebSocket** — o frontend consulta a API (`GET /api/notifications/unread-count` e `GET /api/notifications`) a cada 30s via polling (`refetchInterval` do TanStack Query). Decisão consciente: evita adicionar Socket.IO/infra extra por enquanto; a atualização na prática é quase instantânea. Os jobs periódicos evitam duplicar notificações do mesmo tipo para o mesmo chamado/evento (`notifyOnceForTicket` / `notifyOnceForAppointment`).

---

## Sobre as integrações

### TotalChat

**Implementada e validada contra a API real** (v1.80, base `https://api.totalchat.com.br/`), a partir da documentação oficial fornecida pelo usuário. Fica em `backend/src/integrations/totalchat/`.

Pontos importantes:

- **Não existe webhook nessa API** — é uma API REST de consulta (pull). A sincronização de chamados é feita por **polling**: o backend busca periodicamente as mensagens não lidas de todos os contatos (`GetTodasMensagensNaoLidas`) e cria/atualiza um `Ticket` (`origin: TOTALCHAT`) para cada contato com mensagem nova.
- Login é usuário/senha (mesmo login da plataforma TotalChat), token válido por 12h — configurar em `TOTALCHAT_USERNAME` / `TOTALCHAT_PASSWORD` no `.env`. Recomendado usar um usuário de serviço dedicado, não o login pessoal de alguém.
- Correlação de cliente é feita **por telefone**: se o contato do TotalChat corresponde a um `CustomerContact` já cadastrado, o chamado é vinculado a esse cliente; se não corresponde a nenhum, um `Customer` mínimo é criado automaticamente a partir do nome/telefone do contato (decisão tomada com o usuário em 2026-08-14).
- **`GetTodasMensagensNaoLidas` com `marcaLida=true` retorna HTTP 400** — bug confirmado no próprio servidor do TotalChat em 2026-08-14 (a chamada segue exatamente o formato documentado). Por isso a sincronização busca sempre com `marcaLida=false` e controla "o que já foi processado" pelo lado do RT HELPDESK: compara o id de cada mensagem (`d`) com o maior `totalchatMessageId` já salvo em algum chamado daquele contato, e ignora mensagens já vistas. Efeito colateral positivo: a sincronização **não marca mais as mensagens reais dos clientes como lidas** no TotalChat.
- **Com `marcaLida=false` as páginas não são estritamente disjuntas** — a mesma mensagem pode aparecer em mais de uma página da paginação. A sincronização deduplica por id de mensagem (`d`) antes de processar, então isso não gera texto repetido no chamado.
- **`GetContatoPorId` retorna `{}` para diversos contatos reais e válidos** — outro bug confirmado no servidor do TotalChat em 2026-08-14 (endpoint correto, formato documentado, mas resposta vazia mesmo para contatos com mensagens do mesmo dia). Como esse endpoint é a única forma documentada de obter nome/telefone do contato, quando ele falha a sincronização usa como nome alternativo o campo `f` (nome de quem enviou) da mensagem mais recente — então o cliente ainda é criado com um nome legível, só que **sem telefone**, e por isso não participa da correlação automática por telefone com clientes já cadastrados (precisa ser revisado manualmente depois).
- **Rate limit de ~2 requisições/segundo** na API do TotalChat (header `X-Rate-Limit-Limit: 1s`, observado em 2026-08-14) — a sincronização espera ~400ms entre chamadas (paginação e busca de contato por cliente) para não estourar o limite e receber HTTP 429.
- Limitações conhecidas (documentadas em comentários no código): não há endpoint para listar "todos os atendimentos abertos" de uma vez (só por atendente), não há um id de atendimento confiável disponível a partir das mensagens não lidas, e prioridade/categoria/responsável não são inferidos automaticamente (todo chamado automático nasce com prioridade Normal, sem categoria e sem responsável).

### Base de Conhecimento

**Implementada e conectada à API real** do site Gestão (`https://gestaoconsultorias.fly.dev`), que expõe `GET /api/knowledge-base/articles` (protegido por header `X-API-Key`, retorna só artigos com status `published`). A Base de Conhecimento não é duplicada aqui — o RT HELPDESK só consulta esse endpoint (`backend/src/integrations/knowledge-base/`).

- Configurar `KNOWLEDGE_BASE_API_URL` e `KNOWLEDGE_BASE_API_KEY` no `.env` (mesma chave configurada como secret `KB_API_KEY` no Fly.io do site Gestão). Sem essas variáveis, o client cai automaticamente para os dados mockados que já existiam, então o ambiente continua funcional sem a integração real.
- Suporta busca (`?q=`, aplicada em título/resumo) e listagem — é o que a tela **Base de Conhecimento** usa.

A tela **Configurações → Integrações** nunca exibe uma integração como "Conectada" sem que ela esteja de fato configurada.

---

## Próxima etapa recomendada

1. Usar o vínculo usuário↔atendente do TotalChat para atribuição automática de responsável em chamados criados via TotalChat.
2. Exportação de relatórios em Excel (hoje já tem CSV e PDF).
3. Se o volume de usuários simultâneos crescer, migrar as notificações de polling para WebSocket.
