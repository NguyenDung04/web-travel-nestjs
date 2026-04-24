// src/common/helpers/slug.helper.ts

/**
 * Convert string to URL-friendly slug.
 * - Chuyển về lowercase
 * - Bỏ dấu tiếng Việt
 * - Loại bỏ ký tự đặc biệt
 * - Space -> "-"
 * - Gom "-" liên tiếp thành 1
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD') // tách dấu tiếng Việt
    .replace(/[\u0300-\u036f]/g, '') // remove dấu
    .replace(/[^a-z0-9\s-]/g, '') // bỏ ký tự đặc biệt
    .replace(/\s+/g, '-') // space thành "-"
    .replace(/-+/g, '-'); // bỏ trùng "-"
}
