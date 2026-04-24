import { BadRequestException } from '@nestjs/common';
import type { Express } from 'express';
import { Repository } from 'typeorm';
import { Media } from 'src/model/entities/media.entity';
import { toPublicUrl } from 'src/config/upload.config';

/** Chuẩn hoá từ file Multer → URL public + tên file; chống trùng URL nội bộ */
export async function prepareFromFile(
  mediaRepo: Repository<Media>,
  file: Express.Multer.File,
  excludeId?: number,
): Promise<{ url: string; fileName: string }> {
  const publicUrl = toPublicUrl(file.path);

  const dup = await mediaRepo.findOne({ where: { url: publicUrl } });
  if (dup && dup.id !== excludeId) {
    throw new BadRequestException('File đã tồn tại trong hệ thống');
  }
  return { url: publicUrl, fileName: file.filename };
}
