/* eslint-disable @typescript-eslint/require-await */
// Thiết lập chung cho unit test
jest.setTimeout(30000);

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.JWT_ACCESS_TOKEN_EXPIRES =
  process.env.JWT_ACCESS_TOKEN_EXPIRES || '1d';
process.env.JWT_REFRESH_TOKEN_EXPIRES =
  process.env.JWT_REFRESH_TOKEN_EXPIRES || '7d';

// Fallback: nếu vì lý do nào đó mapper không ăn, mock 'file-type' inline luôn
jest.mock(
  'file-type',
  () => ({
    fileTypeFromBuffer: jest.fn(async () => ({
      ext: 'jpg',
      mime: 'image/jpeg',
    })),
  }),
  { virtual: true },
);

// (tuỳ chọn) dịu bớt log ồn
const _error = console.error;
console.error = (...args: any[]) => {
  if (String(args[0]).includes('DeprecationWarning')) return;
  _error(...args);
};
