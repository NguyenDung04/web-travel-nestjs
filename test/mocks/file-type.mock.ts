export const fileTypeFromBuffer = jest.fn(async () => ({
  ext: 'jpg',
  mime: 'image/jpeg',
}));
export default { fileTypeFromBuffer };
