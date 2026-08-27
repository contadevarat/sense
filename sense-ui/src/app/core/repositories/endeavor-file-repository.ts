import { EndeavorFile } from '../../models/endeavor-file';

/**
 * Persistence contract for files attached to an endeavor. The backend
 * owns everything about how these are linked to S3 - the frontend only
 * ever calls this contract, it never talks to the bucket directly except
 * to PUT bytes to the presigned URL the backend hands back from upload().
 */
export abstract class EndeavorFileRepository {
  abstract list(endeavorId: string): Promise<EndeavorFile[]>;
  abstract upload(endeavorId: string, file: File): Promise<EndeavorFile>;
  abstract delete(endeavorId: string, fileId: string): Promise<void>;
}
