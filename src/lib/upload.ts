export const uploadConfig = {
  maxFileSize: Number(process.env.NEXT_PUBLIC_MAX_FILE_SIZE ?? 5 * 1024 * 1024),
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
};

export function sanitizeFileName(fileName: string) {
  const extension = fileName.split('.').pop() ?? 'jpg';
  const baseName = fileName
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  return `${baseName || 'item-image'}-${Date.now()}.${extension}`;
}
