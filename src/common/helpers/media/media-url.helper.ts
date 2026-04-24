import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Media } from 'src/model/entities/media.entity';
import { mirrorRemoteImage } from 'src/common/helpers/mirror.helper';

/**
 * Chuẩn hoá từ URL:
 *  - autoMirror=true → tải về local, trả /public/... + tên file
 *  - autoMirror=false → validate http/https, chống trùng theo URL ngoài
 */
export async function prepareFromUrl(
  mediaRepo: Repository<Media>,
  rawUrl: string,
  opts?: { autoMirror?: boolean; maxBytes?: number; excludeId?: number },
): Promise<{ url: string; fileName: string }> {
  const autoMirror = opts?.autoMirror ?? true;
  const maxBytes = opts?.maxBytes ?? 5 * 1024 * 1024;
  const excludeId = opts?.excludeId;

  if (autoMirror) {
    const { publicUrl, fileName } = await mirrorRemoteImage(rawUrl, maxBytes);
    return { url: publicUrl, fileName };
  }

  // Không mirror: chỉ lưu URL ngoài
  let u: URL;
  try {
    u = new URL(rawUrl);
  } catch {
    throw new BadRequestException('URL không hợp lệ');
  }
  if (!['http:', 'https:'].includes(u.protocol)) {
    throw new BadRequestException('Chỉ chấp nhận URL http/https');
  }

  const existed = await mediaRepo.findOne({ where: { url: rawUrl } });
  if (existed && existed.id !== excludeId) {
    throw new BadRequestException('URL media đã tồn tại trong hệ thống');
  }

  const fileName = u.pathname.split('/').pop() || 'unnamed';
  return { url: rawUrl, fileName };
}
