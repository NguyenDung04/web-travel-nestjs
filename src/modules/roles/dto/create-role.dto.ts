// create-role.dto.ts
import { IsOptional } from 'class-validator';
import { StringField } from 'src/common/decorators/field-validators.decorator';

export class CreateRoleDto {
  // Bắt buộc, tối thiểu 2 ký tự, tối đa 64, tự trim
  @StringField('Tên vai trò', { min: 2, max: 64 })
  name: string;

  // Tuỳ chọn, tối đa 256, tự trim
  @StringField('Mô tả', { required: false, max: 256 })
  @IsOptional()
  description?: string;
}
