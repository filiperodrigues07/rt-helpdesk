import {
  PrismaClient,
  RoleName,
  TicketPriority,
  TicketStatus,
  TicketOrigin,
  AppointmentType,
  IntegrationProvider,
  IntegrationStatus,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SLA_HOURS: Record<TicketPriority, number> = {
  BAIXA: 48,
  NORMAL: 24,
  ALTA: 8,
  CRITICA: 2,
};

async function main() {
  console.log('Iniciando seed do RT HELPDESK...');

  // ---- Roles ----
  const roleNames: RoleName[] = ['ADMINISTRADOR', 'GERENTE', 'SUPORTE', 'IMPLANTACAO', 'VISUALIZACAO'];
  const roles: Record<RoleName, { id: string }> = {} as Record<RoleName, { id: string }>;

  for (const name of roleNames) {
    const role = await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    roles[name] = role;
  }

  // ---- Permissions (acesso por tela — configurável depois em Configurações → Permissões) ----
  const screenPermissions: Record<string, string> = {
    'screen.chamados': 'Tela Chamados',
    'screen.agenda': 'Tela Agenda',
    'screen.clientes': 'Tela Clientes',
    'screen.base-conhecimento': 'Tela Base de Conhecimento',
    'screen.equipe': 'Tela Equipe',
    'screen.relatorios': 'Tela Relatórios',
    'screen.configuracoes': 'Tela Configurações',
  };

  for (const [key, description] of Object.entries(screenPermissions)) {
    await prisma.permission.upsert({ where: { key }, update: { description }, create: { key, description } });
  }

  const allPermissions = await prisma.permission.findMany();
  const permissionByKey = new Map(allPermissions.map((p) => [p.key, p]));

  // Matriz padrão — só usada na primeira vez (ou se a tela de Permissões nunca
  // tiver sido usada pra alterar); dá pra reconfigurar livremente depois.
  const defaultRoleScreens: Record<RoleName, string[]> = {
    ADMINISTRADOR: Object.keys(screenPermissions),
    GERENTE: Object.keys(screenPermissions),
    SUPORTE: ['screen.chamados', 'screen.agenda', 'screen.clientes', 'screen.base-conhecimento'],
    IMPLANTACAO: ['screen.chamados', 'screen.agenda', 'screen.clientes', 'screen.base-conhecimento'],
    VISUALIZACAO: ['screen.relatorios'],
  };

  // ADMINISTRADOR sempre tem acesso total — não é reconfigurável (trava de segurança
  // pra nunca ficar sem ninguém conseguindo acessar a tela de Permissões).
  await prisma.role.update({
    where: { name: 'ADMINISTRADOR' },
    data: { permissions: { set: defaultRoleScreens.ADMINISTRADOR.map((key) => ({ id: permissionByKey.get(key)!.id })) } },
  });

  for (const [roleName, keys] of Object.entries(defaultRoleScreens) as [RoleName, string[]][]) {
    if (roleName === 'ADMINISTRADOR') continue;
    const role = await prisma.role.findUnique({ where: { name: roleName }, include: { permissions: true } });
    if (!role || role.permissions.length > 0) continue; // já configurado — não sobrescreve
    await prisma.role.update({
      where: { name: roleName },
      data: { permissions: { set: keys.map((key) => ({ id: permissionByKey.get(key)!.id })) } },
    });
  }

  // ---- SLA Rules ----
  for (const [priority, hours] of Object.entries(SLA_HOURS) as [TicketPriority, number][]) {
    await prisma.slaRule.upsert({
      where: { priority },
      update: { responseTimeMin: hours * 60 },
      create: { priority, responseTimeMin: hours * 60 },
    });
  }
  const slaRules = await prisma.slaRule.findMany();
  const slaByPriority = new Map(slaRules.map((rule) => [rule.priority, rule]));

  // ---- Categories ----
  const categoryNames = ['Fiscal', 'Estoque', 'Financeiro', 'Implantação', 'Infraestrutura', 'Treinamento'];
  const categories = [];
  for (const name of categoryNames) {
    categories.push(await prisma.category.upsert({ where: { name }, update: {}, create: { name } }));
  }

  // ---- Tags ----
  const tagNames = ['urgente', 'nfc-e', 'sefaz', 'erp', 'financeiro', 'onboarding', 'bug', 'duvida'];
  const tags = [];
  for (const name of tagNames) {
    tags.push(await prisma.tag.upsert({ where: { name }, update: {}, create: { name } }));
  }

  // ---- Users ----
  const passwordHash = await bcrypt.hash('123456', 10);

  const usersData = [
    { name: 'Ana Souza', email: 'ana.souza@rthelpdesk.com', jobTitle: 'Analista de Suporte', role: 'SUPORTE' as RoleName },
    { name: 'Carlos Lima', email: 'carlos.lima@rthelpdesk.com', jobTitle: 'Gerente de Suporte', role: 'GERENTE' as RoleName },
    { name: 'João Pereira', email: 'joao.pereira@rthelpdesk.com', jobTitle: 'Analista de Suporte', role: 'SUPORTE' as RoleName },
    { name: 'Maria Fernandes', email: 'maria.fernandes@rthelpdesk.com', jobTitle: 'Analista de Implantação', role: 'IMPLANTACAO' as RoleName },
    { name: 'Pedro Alves', email: 'pedro.alves@rthelpdesk.com', jobTitle: 'Analista de Suporte', role: 'SUPORTE' as RoleName },
  ];

  const users = [];
  for (const data of usersData) {
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        name: data.name,
        email: data.email,
        passwordHash,
        jobTitle: data.jobTitle,
        roleId: roles[data.role].id,
      },
    });
    users.push(user);
  }

  // Usuário real do dono do projeto — único Administrador.
  const ownerPasswordHash = await bcrypt.hash('140204', 10);
  const owner = await prisma.user.upsert({
    where: { email: 'filiperodrigueshomework@gmail.com' },
    update: {},
    create: {
      name: 'Filipe Rodrigues',
      email: 'filiperodrigueshomework@gmail.com',
      passwordHash: ownerPasswordHash,
      jobTitle: 'Administrador',
      roleId: roles.ADMINISTRADOR.id,
    },
  });
  users.push(owner);

  // ---- Customers ----
  const customersData = [
    { companyName: 'Comercial Boa Vista Ltda', tradeName: 'Boa Vista', cnpj: '11111111000101', city: 'São Paulo' },
    { companyName: 'Distribuidora Nova Era S.A.', tradeName: 'Nova Era', cnpj: '11111111000102', city: 'Curitiba' },
    { companyName: 'Mercado Central Ltda', tradeName: 'Mercado Central', cnpj: '11111111000103', city: 'Belo Horizonte' },
    { companyName: 'Auto Peças Rodrigues', tradeName: 'Rodrigues Peças', cnpj: '11111111000104', city: 'Porto Alegre' },
    { companyName: 'Farmácia Vida Ltda', tradeName: 'Farmácia Vida', cnpj: '11111111000105', city: 'Salvador' },
    { companyName: 'Construtora Horizonte Ltda', tradeName: 'Horizonte', cnpj: '11111111000106', city: 'Recife' },
    { companyName: 'Padaria Pão Dourado', tradeName: 'Pão Dourado', cnpj: '11111111000107', city: 'Fortaleza' },
    { companyName: 'Móveis Ideal Ltda', tradeName: 'Móveis Ideal', cnpj: '11111111000108', city: 'Campinas' },
    { companyName: 'Tech Solutions Informática', tradeName: 'Tech Solutions', cnpj: '11111111000109', city: 'São José dos Campos' },
    { companyName: 'Restaurante Sabor & Cia', tradeName: 'Sabor & Cia', cnpj: '11111111000110', city: 'Florianópolis' },
  ];

  const customers = [];
  for (const data of customersData) {
    const customer = await prisma.customer.upsert({
      where: { cnpj: data.cnpj },
      update: {},
      create: {
        ...data,
        email: `contato@${data.tradeName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.br`,
        phone: '(11) 4000-0000',
      },
    });
    customers.push(customer);
  }

  // ---- Tickets ----
  const priorities: TicketPriority[] = ['BAIXA', 'NORMAL', 'ALTA', 'CRITICA'];
  const statuses: TicketStatus[] = [
    'NOVO',
    'EM_ANDAMENTO',
    'AGUARDANDO_CLIENTE',
    'AGUARDANDO_TERCEIRO',
    'RESOLVIDO',
    'ENCERRADO',
  ];

  const ticketTitles = [
    'Erro ao emitir NFC-e',
    'Sistema lento ao gerar relatório',
    'Dúvida sobre fechamento de caixa',
    'Falha na comunicação com SEFAZ',
    'Erro ao importar planilha de produtos',
    'Solicitação de treinamento para novo usuário',
    'Problema na integração com balança',
    'Erro ao gerar boleto bancário',
    'Sistema não abre após atualização',
    'Dúvida sobre cálculo de comissão',
    'Erro ao cancelar nota fiscal',
    'Lentidão no módulo financeiro',
    'Solicitação de nova licença de uso',
    'Erro ao sincronizar estoque entre filiais',
    'Problema de impressão de etiquetas',
    'Dúvida sobre configuração de tributação',
    'Erro no login do sistema',
    'Solicitação de backup de dados',
    'Erro ao consultar CFOP',
    'Falha ao emitir relatório gerencial',
  ];

  const existingTickets = await prisma.ticket.count();
  if (existingTickets === 0) {
    for (let i = 0; i < ticketTitles.length; i++) {
      const customer = customers[i % customers.length];
      const assignee = users[(i + 2) % users.length];
      const creator = users[i % users.length];
      const category = categories[i % categories.length];
      const priority = priorities[i % priorities.length];
      const status = statuses[i % statuses.length];
      const slaRule = slaByPriority.get(priority);

      const createdAt = new Date(Date.now() - (i + 1) * 6 * 60 * 60 * 1000);
      const slaDueAt = slaRule ? new Date(createdAt.getTime() + slaRule.responseTimeMin * 60 * 1000) : null;

      const ticket = await prisma.ticket.create({
        data: {
          title: ticketTitles[i],
          description: `Cliente relatou: "${ticketTitles[i]}". Necessário verificar ambiente e reproduzir o problema.`,
          customerId: customer.id,
          assigneeId: assignee.id,
          creatorId: creator.id,
          categoryId: category.id,
          priority,
          status,
          origin: TicketOrigin.MANUAL,
          slaRuleId: slaRule?.id,
          slaDueAt,
          createdAt,
          tags: {
            create: [{ tagId: tags[i % tags.length].id }],
          },
          history: {
            create: [
              {
                action: 'CHAMADO_CRIADO',
                authorId: creator.id,
                createdAt,
              },
              {
                action: 'RESPONSAVEL_ATRIBUIDO',
                authorId: creator.id,
                newValue: assignee.name,
                createdAt: new Date(createdAt.getTime() + 10 * 60 * 1000),
              },
            ],
          },
        },
      });

      if (status === 'RESOLVIDO' || status === 'ENCERRADO') {
        const resolvedAt = new Date(createdAt.getTime() + 3 * 60 * 60 * 1000);

        await prisma.ticketHistory.create({
          data: {
            ticketId: ticket.id,
            action: status === 'RESOLVIDO' ? 'CHAMADO_RESOLVIDO' : 'CHAMADO_ENCERRADO',
            authorId: assignee.id,
            createdAt: resolvedAt,
          },
        });

        await prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            resolvedAt,
            closedAt: status === 'ENCERRADO' ? resolvedAt : null,
            resolvedProblem: 'Problema identificado durante o diagnóstico inicial.',
            rootCause: 'Causa raiz mapeada junto ao time responsável.',
            appliedSolution: 'Solução aplicada e validada com o cliente.',
          },
        });
      }
    }
  }

  // ---- Appointments ----
  const appointmentTypes: AppointmentType[] = [
    'SUPORTE',
    'IMPLANTACAO',
    'TREINAMENTO',
    'REUNIAO',
    'VISITA_TECNICA',
    'RETORNO_CLIENTE',
    'INTERNO',
  ];

  const appointmentTypeLabels: Record<AppointmentType, string> = {
    SUPORTE: 'Suporte',
    IMPLANTACAO: 'Implantação',
    TREINAMENTO: 'Treinamento',
    REUNIAO: 'Reunião',
    VISITA_TECNICA: 'Visita técnica',
    RETORNO_CLIENTE: 'Retorno ao cliente',
    INTERNO: 'Interno',
  };

  const existingAppointments = await prisma.appointment.count();
  if (existingAppointments === 0) {
    for (let i = 0; i < 10; i++) {
      const startsAt = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
      startsAt.setHours(9 + (i % 6), 0, 0, 0);
      const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);

      await prisma.appointment.create({
        data: {
          title: `${appointmentTypeLabels[appointmentTypes[i % appointmentTypes.length]]} - ${customers[i % customers.length].tradeName}`,
          type: appointmentTypes[i % appointmentTypes.length],
          customerId: customers[i % customers.length].id,
          assigneeId: users[i % users.length].id,
          startsAt,
          endsAt,
        },
      });
    }
  }

  // ---- Integrations ----
  await prisma.integration.upsert({
    where: { provider: IntegrationProvider.TOTALCHAT },
    update: {},
    create: {
      provider: IntegrationProvider.TOTALCHAT,
      status: IntegrationStatus.AGUARDANDO_CONFIGURACAO,
      notes: 'Aguardando documentação oficial da API do TotalChat.',
    },
  });

  await prisma.integration.upsert({
    where: { provider: IntegrationProvider.KNOWLEDGE_BASE },
    update: {},
    create: {
      provider: IntegrationProvider.KNOWLEDGE_BASE,
      status: IntegrationStatus.AGUARDANDO_CONFIGURACAO,
      notes: 'API da Base de Conhecimento ainda não configurada. Utilizando dados mockados.',
    },
  });

  console.log('Seed concluído com sucesso.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
