// src/common/pipes/parse-int-id.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseIntIdPipe implements PipeTransform<string, number> {
  transform(value: string): number {
    const val = Number(value);

    // Kiểm tra có phải số nguyên hợp lệ không
    if (!Number.isInteger(val)) {
      throw new BadRequestException('Vui lòng nhập id là số nguyên hợp lệ');
    }

    return val;
  }
}
