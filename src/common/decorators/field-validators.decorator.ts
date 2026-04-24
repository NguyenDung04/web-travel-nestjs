/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { applyDecorators } from '@nestjs/common';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { IsEmailStrict } from 'src/common/decorators/is-email-strict.decorator';

/** Patterns tái sử dụng */
const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]+$/; // a-z 0-9 . _ -
const PHONE_PATTERN = /^\+?[0-9]{8,15}$/; // 8–15 chữ số, có thể có +
const STRONG_PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d).*$/; // ≥1 in hoa & ≥1 số

/** Trim giá trị string trước khi validate */
export function Trim() {
  return Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  );
}

/** Chuỗi cơ bản (vd: login.password, old/confirm password, các text field đơn giản) */
export function StringField(
  label: string,
  opts?: { required?: boolean; min?: number; max?: number },
) {
  const required = opts?.required ?? true;
  const min = opts?.min;
  const max = opts?.max ?? 128;

  const decs: PropertyDecorator[] = [
    Trim(),
    IsString({ message: `${label} phải là chuỗi ký tự` }) as any,
    MaxLength(max, { message: `${label} quá dài` }) as any,
  ];
  if (min)
    decs.push(
      MinLength(min, {
        message: `${label} phải có ít nhất ${min} ký tự`,
      }) as any,
    );
  if (required)
    decs.push(IsNotEmpty({ message: `${label} không được để trống` }) as any);
  else decs.push(IsOptional() as any);

  return applyDecorators(...decs);
}

/** Username hợp lệ: 3–32 ký tự, chỉ a-z 0-9 . _ - */
export function UsernameField(
  label = 'Tên đăng nhập (username)',
  required = true,
) {
  const decs: PropertyDecorator[] = [
    Trim(),
    IsString({ message: `${label} phải là chuỗi ký tự` }) as any,
    MinLength(3, { message: `${label} phải có ít nhất 3 ký tự` }) as any,
    MaxLength(32, { message: `${label} tối đa 32 ký tự` }) as any,
    Matches(USERNAME_PATTERN, {
      message: `${label} chỉ gồm a-z, 0-9, dấu chấm, gạch dưới, gạch ngang`,
    }) as any,
  ];
  decs.push(
    required
      ? (IsNotEmpty({ message: `${label} không được để trống` }) as any)
      : (IsOptional() as any),
  );
  return applyDecorators(...decs);
}

/** Mật khẩu mạnh: ≥6 ký tự, có in hoa & số */
export function StrongPasswordField(label = 'Mật khẩu', required = true) {
  const decs: PropertyDecorator[] = [
    Trim(),
    IsString({ message: `${label} phải là chuỗi ký tự` }) as any,
    MinLength(6, { message: `${label} phải có ít nhất 6 ký tự` }) as any,
    MaxLength(128, { message: `${label} quá dài` }) as any,
    Matches(STRONG_PASSWORD_PATTERN, {
      message: `${label} phải có ít nhất 1 chữ in hoa và 1 số`,
    }) as any,
  ];
  decs.push(
    required
      ? (IsNotEmpty({ message: `${label} không được để trống` }) as any)
      : (IsOptional() as any),
  );
  return applyDecorators(...decs);
}

/** Email chuẩn (dùng IsEmailStrict sẵn có) */
export function EmailField(label = 'Email', optional = true) {
  const decs: PropertyDecorator[] = [
    Trim(),
    IsString({ message: `${label} phải là chuỗi ký tự` }) as any,
    IsEmailStrict(),
    MaxLength(128, { message: `${label} quá dài` }) as any,
  ];
  decs.push(
    optional
      ? (IsOptional() as any)
      : (IsNotEmpty({ message: `${label} không được để trống` }) as any),
  );
  return applyDecorators(...decs);
}

/** Số điện thoại 8–15 chữ số (có thể có +) */
export function PhoneField(label = 'Số điện thoại', optional = true) {
  const decs: PropertyDecorator[] = [
    Trim(),
    IsString({ message: `${label} phải là chuỗi ký tự` }) as any,
    Matches(PHONE_PATTERN, { message: `${label} không hợp lệ` }) as any,
  ];
  decs.push(
    optional
      ? (IsOptional() as any)
      : (IsNotEmpty({ message: `${label} không được để trống` }) as any),
  );
  return applyDecorators(...decs);
}

/** ISO datetime string (vd: lastLoginAt) */
export function IsoDateStringField(label: string, optional = true) {
  const decs: PropertyDecorator[] = [
    Trim(),
    IsDateString({}, { message: `${label} phải là chuỗi ngày giờ ISO` }) as any,
  ];
  decs.push(
    optional
      ? (IsOptional() as any)
      : (IsNotEmpty({ message: `${label} không được để trống` }) as any),
  );
  return applyDecorators(...decs);
}
