// Criptografia simétrica (AES-256-GCM) para credenciais salvas no banco
// (ex.: senha do TotalChat cadastrada em Configurações). A chave é derivada
// do JWT_SECRET já existente — evita depender de mais uma env var só pra isso.

import crypto from 'node:crypto';
import { env } from './env';

const ALGORITHM = 'aes-256-gcm';
const key = crypto.createHash('sha256').update(env.jwtSecret).digest();

export function encrypt(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join('.');
}

export function decrypt(payload: string): string {
  const [ivB64, authTagB64, encryptedB64] = payload.split('.');
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const encrypted = Buffer.from(encryptedB64, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}
