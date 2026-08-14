import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { AppError } from '../utils/AppError';

export const UPLOADS_ROOT = path.resolve(__dirname, '../../uploads');

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
]);

const storage = multer.diskStorage({
  destination: (req, _file, callback) => {
    const ticketId = req.params.id;
    const dir = path.join(UPLOADS_ROOT, 'tickets', ticketId);
    fs.mkdirSync(dir, { recursive: true });
    callback(null, dir);
  },
  filename: (_req, file, callback) => {
    const ext = path.extname(file.originalname);
    callback(null, `${crypto.randomUUID()}${ext}`);
  },
});

export const uploadTicketAttachment = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      callback(new AppError('Tipo de arquivo não permitido', 400));
      return;
    }
    callback(null, true);
  },
}).single('file');

const IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml']);

function imageFileFilter(_req: unknown, file: Express.Multer.File, callback: multer.FileFilterCallback) {
  if (!IMAGE_MIME_TYPES.has(file.mimetype)) {
    callback(new AppError('Envie uma imagem (PNG, JPG, GIF, WEBP ou SVG)', 400));
    return;
  }
  callback(null, true);
}

const avatarStorage = multer.diskStorage({
  destination: (req, _file, callback) => {
    const dir = path.join(UPLOADS_ROOT, 'avatars');
    fs.mkdirSync(dir, { recursive: true });
    callback(null, dir);
  },
  filename: (req, file, callback) => {
    const ext = path.extname(file.originalname);
    const userId = req.user?.id ?? 'unknown';
    callback(null, `${userId}-${crypto.randomUUID()}${ext}`);
  },
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: imageFileFilter,
}).single('file');

const logoStorage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    const dir = path.join(UPLOADS_ROOT, 'branding');
    fs.mkdirSync(dir, { recursive: true });
    callback(null, dir);
  },
  filename: (_req, file, callback) => {
    const ext = path.extname(file.originalname);
    callback(null, `logo${ext}`);
  },
});

export const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: imageFileFilter,
}).single('file');
