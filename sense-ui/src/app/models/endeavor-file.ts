export const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const ACCEPTED_FILE_EXTENSIONS = ['.pdf', '.jpeg', '.jpg', '.png', '.doc', '.docx'];

export interface EndeavorFile {
  id: string;
  endeavorId: string;
  name: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
  downloadUrl: string;
}
