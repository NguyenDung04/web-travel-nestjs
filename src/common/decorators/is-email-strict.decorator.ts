import { applyDecorators } from '@nestjs/common';
import { IsEmail } from 'class-validator';

/**
 * Decorator kiểm tra email với cấu hình strict.
 * Dùng thay thế trực tiếp cho @IsEmail trong DTO.
 *
 * @param message - Thông báo lỗi tuỳ chỉnh (mặc định: 'Email không đúng định dạng')
 */
export function IsEmailStrict(message = 'Email không đúng định dạng') {
  return applyDecorators(
    IsEmail(
      {
        allow_display_name: false,
        require_tld: true, // bắt buộc có .com/.vn...
        allow_ip_domain: false,
        domain_specific_validation: true,
      },
      { message },
    ),
  );
}
