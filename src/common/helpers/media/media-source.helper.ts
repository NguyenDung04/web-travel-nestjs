import { BadRequestException } from '@nestjs/common';
import type { Express } from 'express';

/** Đảm bảo chỉ nhận HOẶC url HOẶC file */
export function assertSingleSource(
  url?: string,
  file?: Express.Multer.File,
): { hasUrl: boolean; hasFile: boolean } {
  const hasUrl = !!url;
  const hasFile = !!file;

  if (!hasUrl && !hasFile) {
    throw new BadRequestException('Cần truyền URL hoặc upload file');
  }
  if (hasUrl && hasFile) {
    throw new BadRequestException('Chỉ chọn 1 trong 2: URL hoặc file');
  }
  return { hasUrl, hasFile };
}
