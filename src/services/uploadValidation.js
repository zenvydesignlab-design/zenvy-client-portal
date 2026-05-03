const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const DOCUMENT_TYPES = ['application/pdf'];
const ONE_MB = 1024 * 1024;
const FIVE_MB = 5 * ONE_MB;

export function validateUploadFile(file) {
  if (!file) throw new Error('Select a file to upload');
  if (IMAGE_TYPES.includes(file.type)) {
    if (file.size > ONE_MB) throw new Error('Image must be under 1MB');
    return 'image';
  }
  if (DOCUMENT_TYPES.includes(file.type)) {
    if (file.size > FIVE_MB) throw new Error('File must be under 5MB');
    return 'document';
  }
  throw new Error('Unsupported file type');
}
