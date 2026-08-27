import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EndeavorFile } from '../../models/endeavor-file';
import { EndeavorFileRepository } from './endeavor-file-repository';

interface EndeavorFileUploadResult {
  file: EndeavorFile;
  uploadUrl: string;
}

/**
 * Talks to the backend's file endpoints:
 *
 *   GET    {apiBaseUrl}/endeavors/:id/files                -> EndeavorFile[]
 *   POST   {apiBaseUrl}/endeavors/:id/files                <- {name, contentType, sizeBytes} -> {file, uploadUrl}
 *   DELETE {apiBaseUrl}/endeavors/:id/files/:fileId
 *
 * upload() does two hops: it asks the backend for a presigned S3 URL,
 * then PUTs the file bytes straight to S3 with that URL. The frontend
 * never needs to know the bucket name or key format - that's entirely
 * the backend's concern.
 */
@Injectable()
export class EndeavorFileHttpRepository implements EndeavorFileRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/endeavors`;

  list(endeavorId: string): Promise<EndeavorFile[]> {
    return firstValueFrom(this.http.get<EndeavorFile[]>(`${this.baseUrl}/${endeavorId}/files`));
  }

  async upload(endeavorId: string, file: File): Promise<EndeavorFile> {
    const result = await firstValueFrom(
      this.http.post<EndeavorFileUploadResult>(`${this.baseUrl}/${endeavorId}/files`, {
        name: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      }),
    );

    try {
      await firstValueFrom(
        this.http.put(result.uploadUrl, file, {
          headers: new HttpHeaders({ 'Content-Type': file.type }),
          responseType: 'text',
        }),
      );
    } catch (err) {
      // The metadata row was already created server-side - without this the
      // file would still show up in the list even though nothing was written to S3.
      await this.delete(endeavorId, result.file.id).catch(() => undefined);
      throw err;
    }

    return result.file;
  }

  async delete(endeavorId: string, fileId: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${endeavorId}/files/${fileId}`));
  }
}
