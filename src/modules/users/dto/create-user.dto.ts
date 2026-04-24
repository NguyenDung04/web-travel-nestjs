import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { UserStatus } from 'src/common/constants/user-status.enum';
import {
  UsernameField,
  EmailField,
  PhoneField,
  StrongPasswordField,
  IsoDateStringField,
} from 'src/common/decorators/field-validators.decorator';

export class CreateUserDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'role_id phải là số' })
  @Min(1, { message: 'role_id phải >= 1' })
  role_id: number;

  @UsernameField() // 3–32 ký tự, a-z 0-9 . _ -
  username: string;

  @EmailField('Email', true)
  email?: string;

  @PhoneField('Số điện thoại', true)
  phone?: string;

  @StrongPasswordField('Mật khẩu (password)')
  password: string;

  @IsOptional()
  @IsEnum(UserStatus, { message: 'Trạng thái tài khoản không hợp lệ' })
  status?: UserStatus;

  @IsoDateStringField('Thời gian đăng nhập cuối cùng (lastLoginAt)', true)
  lastLoginAt?: string;
}
