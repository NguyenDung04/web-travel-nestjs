import { StringField } from 'src/common/decorators/field-validators.decorator';

export class LoginDto {
  // nhập username HOẶC email → dùng StringField (không regex chặn @)
  @StringField('Tên đăng nhập hoặc email', { max: 128 })
  username: string;

  @StringField('Mật khẩu', { max: 128 })
  password: string;
}
