// src/shared/helpers/media-mirror.helper.ts
import axios from 'axios';
import { fileTypeFromBuffer } from 'file-type';
import { existsSync, mkdirSync } from 'fs';
import * as fs from 'fs/promises';
import { join } from 'path';
import { IMAGE_UPLOAD_ROOT, toPublicUrl } from 'src/config/upload.config';

/**
 * Tạo thư mục đích nếu chưa có.
 */
function ensureDir(dir: string) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

/**
 * Thư mục theo năm/tháng: YYYY/MM
 */
function yyyymm(): string {
  const d = new Date();
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Tải ảnh từ URL và lưu vào public/image/YYYY/MM, trả về URL public và tên file.
 * KHÔNG kiểm tra SSRF / IP private — theo yêu cầu của bạn.
 */
export async function mirrorRemoteImage(
  urlStr: string,
  maxBytes = Number(process.env.UPLOAD_IMAGE_MAX_BYTES ?? 5 * 1024 * 1024),
): Promise<{ publicUrl: string; fileName: string }> {
  let u: URL;
  try {
    u = new URL(urlStr);
  } catch {
    throw new Error('URL không hợp lệ');
  }
  if (!['http:', 'https:'].includes(u.protocol)) {
    throw new Error('Chỉ chấp nhận URL http/https');
  }

  const resp = await axios
    .get<ArrayBuffer>(u.toString(), {
      responseType: 'arraybuffer',
      timeout: 10_000,
      validateStatus: (s) => s >= 200 && s < 400,
      maxContentLength: maxBytes,
    })
    .catch(() => {
      throw new Error('Không tải được ảnh từ URL');
    });

  const buf = Buffer.from(resp.data);
  if (buf.length === 0) throw new Error('Ảnh rỗng');
  if (buf.length > maxBytes)
    throw new Error('Ảnh vượt quá kích thước cho phép');

  const ft = await fileTypeFromBuffer(buf);
  if (!ft || !ft.mime.startsWith('image/')) {
    throw new Error('URL không trỏ tới file ảnh hợp lệ');
  }

  const folder = join(IMAGE_UPLOAD_ROOT, yyyymm());
  ensureDir(folder);

  const stamp = Date.now();
  const rand = Math.round(Math.random() * 1e9);
  const fileName = `${stamp}_${rand}.${ft.ext}`;
  const absPath = join(folder, fileName);

  await fs.writeFile(absPath, buf);

  return { publicUrl: toPublicUrl(absPath), fileName };
}
