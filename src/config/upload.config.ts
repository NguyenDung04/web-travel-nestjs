/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-unsafe-return */
// src/config/upload.config.ts
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join, sep } from 'path';

export const IMAGE_UPLOAD_ROOT = join(process.cwd(), 'public', 'image');

function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function yyyymm() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}/${m}`;
}

export const imageMulterOptions = {
  storage: diskStorage({
    destination: (req, file, cb) => {
      const folder = join(IMAGE_UPLOAD_ROOT, yyyymm());
      ensureDir(folder);
      cb(null, folder);
    },
    filename: (req, file, cb) => {
      const ext = extname(file.originalname || '').toLowerCase();
      const stamp = Date.now();
      const rand = Math.round(Math.random() * 1e9);
      cb(null, `${stamp}_${rand}${ext}`);
    },
  }),
  fileFilter: (req: any, file: Express.Multer.File, cb: Function) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.mimetype)) {
      return cb(
        new Error('Chỉ chấp nhận file ảnh (jpeg, png, webp, gif).'),
        false,
      );
    }
    cb(null, true);
  },
  limits: {
    fileSize: Number(process.env.UPLOAD_IMAGE_MAX_BYTES ?? 5 * 1024 * 1024), // 5MB mặc định
  },
};

/** Trả về URL public từ absolute path (file.path) */
export function toPublicUrl(absPath: string): string {
  const idx = absPath.replace(/\\/g, '/').indexOf('/public/');
  if (idx >= 0) return absPath.replace(/\\/g, '/').slice(idx);
  const rel = absPath.replace(process.cwd() + sep, '').replace(/\\/g, '/');
  return `/public/${rel.split('public/')[1] ?? rel}`;
}
