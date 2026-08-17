import dotenv from 'dotenv';
import path from 'node:path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { prisma } from '../utils/prisma';
import { notificationService } from '../services/notificationService';
import { buildAttendantIdByName, resolveCurrentAttendant } from '../integrations/totalchat/service';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const attendantIdByName = await buildAttendantIdByName();

  const tickets = await prisma.ticket.findMany({
    where: {
      origin: 'TOTALCHAT',
      assigneeId: null,
      status: { notIn: ['RESOLVIDO', 'ENCERRADO'] },
      totalchatContactId: { not: null },
    },
    select: { id: true, number: true, title: true, totalchatContactId: true },
  });

  console.log(`${tickets.length} chamados do TotalChat sem responsável.`);

  let assigned = 0;
  let noAttendantFound = 0;
  let errors = 0;

  for (const ticket of tickets) {
    await delay(400);
    try {
      const assignee = await resolveCurrentAttendant(Number(ticket.totalchatContactId), attendantIdByName);

      if (!assignee) {
        noAttendantFound += 1;
        console.log(`#${ticket.number}: sem atendente identificável`);
        continue;
      }

      await prisma.ticket.update({ where: { id: ticket.id }, data: { assigneeId: assignee.id } });
      await prisma.ticketHistory.create({
        data: { ticketId: ticket.id, action: 'RESPONSAVEL_ATRIBUIDO', newValue: assignee.name },
      });
      await notificationService.notify({
        userId: assignee.id,
        type: 'CHAMADO_ATRIBUIDO',
        title: `Chamado atribuído: #${ticket.number}`,
        message: ticket.title,
        relatedTicketId: ticket.id,
        relatedUrl: `/chamados/${ticket.id}`,
      });

      console.log(`#${ticket.number} -> ${assignee.name}`);
      assigned += 1;
    } catch (error) {
      console.error(`#${ticket.number}: erro`, error instanceof Error ? error.message : error);
      errors += 1;
    }
  }

  console.log(`\nResumo: ${assigned} atribuídos, ${noAttendantFound} sem atendente identificável, ${errors} erros.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('erro geral:', error);
    process.exit(1);
  });
