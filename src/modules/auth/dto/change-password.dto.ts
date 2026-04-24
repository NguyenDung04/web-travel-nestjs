import {
  StringField,
  StrongPasswordField,
} from 'src/common/decorators/field-validators.decorator';

export class ChangePasswordDto {
  @StringField('Mật khẩu cũ', { max: 128 })
  oldPassword: string;

  @StrongPasswordField('Mật khẩu mới')
  newPassword: string;

  @StringField('Xác nhận mật khẩu mới', { max: 128 })
  confirmPassword: string;
}
