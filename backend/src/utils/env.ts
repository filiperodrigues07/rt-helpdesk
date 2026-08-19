import path from 'node:path';
import dotenv from 'dotenv';

// Em Docker, as variáveis já são injetadas via env_file/environment.
// Em desenvolvimento local, o .env fica na raiz do monorepo.
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3333),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  // URL pública onde este backend está acessível (ex.: https://helpdesk.empresa.com.br).
  // Necessária só para enviar templates de WhatsApp com imagem no cabeçalho — a Meta
  // busca a imagem depois, de forma assíncrona, a partir de uma URL absoluta e pública.
  // Não funciona a partir de localhost em desenvolvimento.
  appPublicUrl: process.env.APP_PUBLIC_URL || undefined,
  totalChat: {
    apiUrl: process.env.TOTALCHAT_API_URL ?? 'https://api.totalchat.com.br/',
    username: process.env.TOTALCHAT_USERNAME || undefined,
    password: process.env.TOTALCHAT_PASSWORD || undefined,
    connectionId: process.env.TOTALCHAT_CONNECTION_ID
      ? Number(process.env.TOTALCHAT_CONNECTION_ID)
      : undefined,
    pollingEnabled: process.env.TOTALCHAT_POLLING_ENABLED === 'true',
    pollIntervalSeconds: Number(process.env.TOTALCHAT_POLL_INTERVAL_SECONDS ?? 60),
  },
  knowledgeBase: {
    apiUrl: process.env.KNOWLEDGE_BASE_API_URL || undefined,
    apiKey: process.env.KNOWLEDGE_BASE_API_KEY || undefined,
  },
  superAdmin: {
    bootstrapEmail: process.env.SUPER_ADMIN_EMAIL || undefined,
    bootstrapPassword: process.env.SUPER_ADMIN_PASSWORD || undefined,
  },
};
