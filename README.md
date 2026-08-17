# RT HELPDESK

Sistema web interno para gestão da equipe de suporte e implantação de sistemas ERP. Centraliza chamados, agenda, clientes, equipe e indicadores de produtividade.

> **Etapa atual: Etapa 13.** Todos os módulos da especificação original estão implementados: Fundação, **Chamados**, **integração real com o TotalChat**, **Clientes** (com importação/exportação CSV e exclusão), **Agenda**, **Equipe** (usuários + produtividade, com exclusão), **Relatórios** (filtros, gráficos e exportação CSV/PDF), **Notificações** (central no header, por polling) e **Base de Conhecimento** (CRUD completo via API real do site Gestão — ver, criar, editar e excluir artigos sem sair do sistema). Além disso: **logo customizável**, **credenciais do TotalChat editáveis em Configurações** (sem precisar mexer no `.env`), **autoatendimento de perfil** e **permissões por tela** (Configurações → Permissões — controla quais papéis acessam cada tela do sistema). O que resta é evolução: atribuição automática via TotalChat e exportação de relatórios em Excel.

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
│       │   └── knowledge-base/  # API real do site Gestão (CRUD completo); mock só se não configurada
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
| Ana Souza | ana.souza@rthelpdesk.com | 123456 | Suporte |
| Carlos Lima | carlos.lima@rthelpdesk.com | 123456 | Gerente |
| João Pereira | joao.pereira@rthelpdesk.com | 123456 | Suporte |
| Maria Fernandes | maria.fernandes@rthelpdesk.com | 123456 | Implantação |
| Pedro Alves | pedro.alves@rthelpdesk.com | 123456 | Suporte |
| Filipe Rodrigues | filiperodrigueshomework@gmail.com | 140204 | **Administrador** (único) |

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
GET    /api/tickets/:id/conversation (mensagens do cliente e da equipe via TotalChat — só chamados com origem TotalChat)
PATCH  /api/tickets/:id               (título/descrição/tags sempre editáveis; prioridade/responsável/categoria só se o chamado não estiver Resolvido/Encerrado)
PATCH  /api/tickets/:id/status        (só entre os 4 status abertos — rejeita se o chamado já estiver Resolvido/Encerrado)
POST   /api/tickets/:id/resolve       (problema/causa raiz/solução — sempre move para Resolvido; rejeita se já for Resolvido/Encerrado)
POST   /api/tickets/:id/close         (Encerrado — só permitido a partir de Resolvido)
POST   /api/tickets/:id/reopen        (motivo opcional — volta pra Em andamento, recalcula SLA, arquiva a solução anterior no histórico)
POST   /api/tickets/:id/comments
POST   /api/tickets/:id/attachments   (multipart/form-data)
POST   /api/tickets/:id/messages                      (responde ao cliente via WhatsApp — texto e/ou anexos, multipart/form-data; só chamados com origem TotalChat)
GET    /api/tickets/:id/whatsapp-templates             (templates aprovados na Meta, via Cloud API do TotalChat)
GET    /api/tickets/:id/whatsapp-templates/:templateId
POST   /api/tickets/:id/whatsapp-template/header-image (upload de imagem de cabeçalho de template, multipart/form-data — exige APP_PUBLIC_URL)
POST   /api/tickets/:id/whatsapp-template              (envia template aprovado — reabre conversa fora da janela de 24h)

GET    /api/integrations
POST   /api/integrations/totalchat/test    (testa login — sem efeitos colaterais)
POST   /api/integrations/totalchat/sync    (sincronização manual — ver aviso na seção TotalChat)
GET    /api/integrations/totalchat/whatsapp-sources    (Fontes Cloud API configuradas na conta — Administrador/Gerente)
GET    /api/integrations/totalchat/config  (credenciais salvas — sem a senha; Administrador/Gerente)
PUT    /api/integrations/totalchat/config  (salva usuário/senha/URL/connectionId/polling; Administrador/Gerente)

GET    /api/permissions/matrix          (papéis x telas — Administrador)
PUT    /api/permissions/roles/:roleId   (define as telas de um papel — Administrador; bloqueado para o próprio Administrador)

GET    /api/knowledge-base            (?q= para pesquisa — inclui rascunhos, API real do site Gestão)
GET    /api/knowledge-base/categories (categorias disponíveis, para o formulário de artigo)
GET    /api/knowledge-base/:id        (artigo com conteúdo completo)
POST   /api/knowledge-base            (cria artigo — Administrador/Gerente)
PATCH  /api/knowledge-base/:id        (atualiza, incl. status rascunho/publicado — Administrador/Gerente)
DELETE /api/knowledge-base/:id        (Administrador/Gerente)
POST   /api/knowledge-base/images     (upload de imagem do editor — multipart, PNG/JPG/GIF/WEBP até 50MB, Administrador/Gerente)
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
/base-de-conhecimento    Artigos da API real do site Gestão — ver conteúdo completo inline, criar, editar e excluir (Administrador/Gerente)
/equipe                  Gerenciamento de usuários (criar/editar/ativar/desativar/excluir) + métricas de produtividade
/relatorios              Filtros (período/cliente/responsável/categoria/prioridade/status), gráficos e exportação CSV/PDF
/configuracoes           Identidade visual (logo customizável) + status das integrações + testar/sincronizar TotalChat
```

Menu do usuário (canto inferior da Sidebar) → **Meu perfil**: upload de foto, edição de nome/e-mail/cargo e troca de senha.

---

## Estrutura do banco (Prisma)

Modelos criados: `User`, `Role`, `Permission`, `Customer`, `CustomerContact`, `Ticket`, `TicketComment`, `TicketHistory`, `TicketAttachment`, `Tag`, `TicketTag`, `Category`, `Appointment`, `SlaRule`, `Notification`, `Integration`, `TotalChatConfig`.

Todos os modelos usam UUID como chave primária e possuem `createdAt`/`updatedAt`. O schema já contempla os campos estruturais para a futura integração com o TotalChat (`totalchatConversationId`, `totalchatContactId`, etc.), mas nenhum valor é preenchido até a integração real ser implementada.

Os valores de SLA (`SlaRule`) são configuráveis via banco, não fixos no código:

```text
Baixa    → 48 horas
Normal   → 24 horas
Alta     → 8 horas
Crítica  → 2 horas
```

---

## Permissões por tela

Controla quais papéis acessam quais telas — **Configurações → Permissões** (visível só para Administrador). Reaproveita os modelos `Role`/`Permission` já existentes no schema (many-to-many), com uma chave `screen.<nome>` por tela: `screen.chamados`, `screen.agenda`, `screen.clientes`, `screen.base-conhecimento`, `screen.equipe`, `screen.relatorios`, `screen.configuracoes`.

- **Dashboard não entra na matriz** — sempre acessível pra qualquer usuário autenticado (precisa de uma tela inicial).
- **Administrador sempre tem acesso total** e não aparece editável na matriz — trava de segurança pra nunca ficar sem ninguém conseguindo entrar em Configurações e corrigir um engano na própria matriz.
- Aplicado nos dois lados: o frontend esconde os itens do menu e redireciona pra `/` se a rota for acessada direto pela URL (`ScreenRoute`); o backend valida de novo em cada request (`requireScreenPermission`), então não dá pra contornar chamando a API diretamente.
- **Endpoints usados por múltiplas telas ficam fora do bloqueio** (ex.: `GET /customers/minimal` e `GET /users`, usados em dropdowns de Chamados/Agenda mesmo por quem não tem a tela Clientes/Equipe liberada; `GET /integrations/totalchat/attendants`, usado no formulário de usuário em Equipe) — senão bloquear uma tela quebraria funcionalidades de outra.
- Matriz padrão aplicada no seed (reconfigurável livremente depois, sem afetar o Administrador): Gerente com acesso total; Suporte/Implantação com Chamados, Agenda, Clientes e Base de Conhecimento; Visualização só com Relatórios.

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

- **Credenciais editáveis em Configurações** (Administrador/Gerente) — usuário, senha, URL da API, Connection ID e liga/desliga do polling automático, sem precisar mexer no `.env`. Fica salvo no banco (`TotalChatConfig`, linha única), com a senha **criptografada em repouso** (AES-256-GCM, chave derivada do `JWT_SECRET`). O `.env` continua funcionando como fallback caso a configuração pelo banco nunca tenha sido preenchida. Salvar reavalia o polling na hora (liga/desliga/muda intervalo sem precisar reiniciar o backend).
- **Não existe webhook nessa API** — é uma API REST de consulta (pull). A sincronização de chamados é feita por **polling**: o backend busca periodicamente as mensagens não lidas de todos os contatos (`GetTodasMensagensNaoLidas`) e cria/atualiza um `Ticket` (`origin: TOTALCHAT`) para cada contato com mensagem nova.
- Login é usuário/senha (mesmo login da plataforma TotalChat), token válido por 12h — configurar em `TOTALCHAT_USERNAME` / `TOTALCHAT_PASSWORD` no `.env`. Recomendado usar um usuário de serviço dedicado, não o login pessoal de alguém.
- Correlação de cliente é feita **por telefone**: se o contato do TotalChat corresponde a um `CustomerContact` já cadastrado, o chamado é vinculado a esse cliente; se não corresponde a nenhum, um `Customer` mínimo é criado automaticamente a partir do nome/telefone do contato (decisão tomada com o usuário em 2026-08-14).
- **`GetTodasMensagensNaoLidas` com `marcaLida=true` retorna HTTP 400** — bug confirmado no próprio servidor do TotalChat em 2026-08-14 (a chamada segue exatamente o formato documentado). Por isso a sincronização busca sempre com `marcaLida=false` e controla "o que já foi processado" pelo lado do RT HELPDESK: compara o id de cada mensagem (`d`) com o maior `totalchatMessageId` já salvo em algum chamado daquele contato, e ignora mensagens já vistas. Efeito colateral positivo: a sincronização **não marca mais as mensagens reais dos clientes como lidas** no TotalChat.
- **Com `marcaLida=false` as páginas não são estritamente disjuntas** — a mesma mensagem pode aparecer em mais de uma página da paginação. A sincronização deduplica por id de mensagem (`d`) antes de processar, então isso não gera texto repetido no chamado.
- **`GetContatoPorId` retorna `{}` para diversos contatos reais e válidos** — outro bug confirmado no servidor do TotalChat em 2026-08-14 (endpoint correto, formato documentado, mas resposta vazia mesmo para contatos com mensagens do mesmo dia). Como esse endpoint é a única forma documentada de obter nome/telefone do contato, quando ele falha a sincronização usa como nome alternativo o campo `f` (nome de quem enviou) da mensagem mais recente — então o cliente ainda é criado com um nome legível, só que **sem telefone**, e por isso não participa da correlação automática por telefone com clientes já cadastrados (precisa ser revisado manualmente depois).
- **Rate limit de ~2 requisições/segundo** na API do TotalChat (header `X-Rate-Limit-Limit: 1s`, observado em 2026-08-14) — a sincronização espera ~400ms entre chamadas (paginação e busca de contato por cliente) para não estourar o limite e receber HTTP 429.
- **Conversa completa no chamado** (`GET /api/tickets/:id/conversation`, botão "Carregar conversa completa" no detalhe do chamado) — mostra as mensagens do cliente e as respostas da equipe lado a lado, com imagens/áudios renderizados de verdade (documentos como link pra abrir), nome de quem enviou (o atendente é identificado pelo `totalchatAttendantId` vinculado ao usuário) e horário. Usa `GetMensagens` (histórico completo do contato no TotalChat, não escopado por atendimento) filtrado pela janela de tempo do próprio chamado (criação do chamado − 24h até agora), já que um contato pode ter milhares de mensagens de atendimentos antigos.
- **Mídia recebida (imagem/áudio/documento) é pública em `https://media.totalchat.com.br/<caminho>`, sem autenticação** — descoberto em 2026-08-14: não é documentado (a API só documenta os endpoints de *envio*, `EnviaImagem`/`EnviaDocumento`), e os caminhos `img`/`arqu` retornados pelas mensagens ora vêm como URL absoluta já com esse domínio (`GetMensagens`), ora como caminho relativo (`GetTodasMensagensNaoLidas`) — nos dois casos, prefixar com `https://media.totalchat.com.br/` funciona (`resolveMediaUrl` em `integrations/totalchat/service.ts`).
- Limitações conhecidas (documentadas em comentários no código): não há endpoint para listar "todos os atendimentos abertos" de uma vez (só por atendente), não há um id de atendimento confiável disponível a partir das mensagens não lidas, e prioridade/categoria/responsável não são inferidos automaticamente (todo chamado automático nasce com prioridade Normal, sem categoria e sem responsável).

### Base de Conhecimento

**Via API real do site Gestão** (`https://gestaoconsultorias.fly.dev/api/knowledge-base/*`, protegida por header `X-API-Key`) — não é só leitura, é uma integração de mão dupla: o RT HELPDESK lista, visualiza (conteúdo completo renderizado como markdown, sem sair do sistema), cria, edita e exclui artigos, e tudo reflete no site Gestão imediatamente (e vice-versa — artigos criados pelo painel do próprio site aparecem aqui também).

- Configurar `KNOWLEDGE_BASE_API_URL` e `KNOWLEDGE_BASE_API_KEY` no `.env` (mesma chave configurada como secret `KB_API_KEY` no Fly.io do site Gestão). Sem essas variáveis, o client cai automaticamente para dados mockados somente-leitura, então o ambiente continua funcional sem a integração real.
- Tela **Base de Conhecimento**: clicar num artigo abre o conteúdo completo (markdown, com imagens) num diálogo — nunca abre o site em nova aba. Botão **Novo artigo** (Administrador/Gerente) cria com status Rascunho ou Publicado; editar/excluir também ficam disponíveis a partir do artigo aberto.
- Rascunhos (`status: draft`) aparecem normalmente para a equipe no RT HELPDESK (com badge "Rascunho"), mas não aparecem na página pública do site até serem publicados — o filtro de "só publicados" é o padrão da API quando chamada sem o parâmetro `status`.
- Slug do artigo é gerado automaticamente a partir do título pelo lado do site Gestão (garante unicidade); RT HELPDESK não precisa se preocupar com isso.

A tela **Configurações → Integrações** nunca exibe uma integração como "Conectada" sem que ela esteja de fato configurada.

---

## Próxima etapa recomendada

1. Usar o vínculo usuário↔atendente do TotalChat para atribuição automática de responsável em chamados criados via TotalChat.
2. Exportação de relatórios em Excel (hoje já tem CSV e PDF).
3. Se o volume de usuários simultâneos crescer, migrar as notificações de polling para WebSocket.
