import { app } from './app';
import { env } from './utils/env';
import { startTotalChatPolling } from './integrations/totalchat/service';
import { startNotificationJobs } from './jobs/notificationJobs';

app.listen(env.port, () => {
  console.log(`RT HELPDESK API rodando em http://localhost:${env.port}`);
  startTotalChatPolling();
  startNotificationJobs();
});
