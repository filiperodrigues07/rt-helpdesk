import fs from 'node:fs';
import path from 'node:path';
import { Request, Response } from 'express';
import { UPLOADS_ROOT } from '../middlewares/upload';
import { ok } from '../utils/apiResponse';

const BRANDING_DIR = path.join(UPLOADS_ROOT, 'branding');

function findLogoFile(): string | null {
  if (!fs.existsSync(BRANDING_DIR)) return null;
  const files = fs.readdirSync(BRANDING_DIR).filter((file) => file.startsWith('logo.'));
  return files[0] ?? null;
}

export const settingsController = {
  async getLogo(_req: Request, res: Response) {
    const file = findLogoFile();
    return ok(res, { url: file ? `/uploads/branding/${file}` : null });
  },

  async uploadLogo(req: Request, res: Response) {
    const uploadedFile = req.file;

    // Remove versões anteriores da logo (extensão pode ter mudado).
    if (fs.existsSync(BRANDING_DIR) && uploadedFile) {
      for (const file of fs.readdirSync(BRANDING_DIR)) {
        if (file.startsWith('logo.') && file !== uploadedFile.filename) {
          fs.unlinkSync(path.join(BRANDING_DIR, file));
        }
      }
    }

    return ok(res, { url: uploadedFile ? `/uploads/branding/${uploadedFile.filename}` : null });
  },

  async removeLogo(_req: Request, res: Response) {
    if (fs.existsSync(BRANDING_DIR)) {
      for (const file of fs.readdirSync(BRANDING_DIR)) {
        fs.unlinkSync(path.join(BRANDING_DIR, file));
      }
    }
    return ok(res, { url: null });
  },
};
