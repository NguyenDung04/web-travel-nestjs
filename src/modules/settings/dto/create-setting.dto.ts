// create-setting.dto.ts
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { SettingsGroup } from 'src/common/constants/settings-group.enum';
import { SettingsInputType } from 'src/common/constants/settings-input-type.enum';

export class CreateSettingDto {
  @IsNumber({}, { message: 'start_web phải là số' })
  start_web: number;

  @IsString({ message: 'Key phải là chuỗi ký tự' })
  key: string;

  @IsEnum(SettingsGroup, { message: 'group_key không hợp lệ' })
  group_key: SettingsGroup;

  @IsString({ message: 'Label phải là chuỗi ký tự' })
  @IsOptional()
  label?: string;

  @IsString({ message: 'value_string phải là chuỗi ký tự' })
  @IsOptional()
  value_string?: string;

  @IsString({ message: 'value_text phải là chuỗi ký tự' })
  @IsOptional()
  value_text?: string;

  @IsNumber({}, { message: 'value_int phải là số' })
  @IsOptional()
  value_int?: number;

  @IsNumber({}, { message: 'value_decimal phải là số' })
  @IsOptional()
  value_decimal?: number;

  @IsBoolean({ message: 'value_bool phải là kiểu boolean (true/false)' })
  @IsOptional()
  value_bool?: boolean;

  @IsString({ message: 'value_date phải là chuỗi ký tự (ISO date string)' })
  @IsOptional()
  value_date?: string;

  @IsString({
    message: 'value_datetime phải là chuỗi ký tự (ISO datetime string)',
  })
  @IsOptional()
  value_datetime?: string;

  @IsString({ message: 'value_json phải là chuỗi ký tự JSON hợp lệ' })
  @IsOptional()
  value_json?: string;

  @IsEnum(SettingsInputType, { message: 'input_type không hợp lệ' })
  @IsOptional()
  input_type?: SettingsInputType;

  @IsBoolean({ message: 'is_public phải là kiểu boolean (true/false)' })
  @IsOptional()
  is_public?: boolean;

  @IsBoolean({ message: 'is_secure phải là kiểu boolean (true/false)' })
  @IsOptional()
  is_secure?: boolean;

  @IsNumber({}, { message: 'sort_order phải là số' })
  @IsOptional()
  sort_order?: number;
}
