// create-customer.dto.ts
import { IsString, IsOptional, Matches } from 'class-validator';
import { IsEmailStrict } from 'src/common/decorators/is-email-strict.decorator';

export class CreateCustomerDto {
  @IsString({ message: 'Họ và tên khách hàng phải là chuỗi ký tự' })
  full_name: string;

  @IsString({ message: 'Email phải là chuỗi ký tự' })
  @IsEmailStrict()
  @IsOptional()
  email?: string;

  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @Matches(/^0\d{9,10}$/, {
    message: 'Số điện thoại phải bắt đầu bằng 0 và gồm 10 hoặc 11 chữ số',
  })
  @IsOptional()
  phone?: string;

  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  @IsOptional()
  note?: string;
}
