import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Endeavor, EndeavorInput } from '../../models/endeavor';
import { EndeavorRepository } from './endeavor-repository';

/**
 * Talks to a REST API in front of the real database. Any backend works
 * as long as it implements this contract:
 *
 *   GET    {apiBaseUrl}/endeavors       -> Endeavor[]
 *   GET    {apiBaseUrl}/endeavors/:id   -> Endeavor
 *   POST   {apiBaseUrl}/endeavors       <- EndeavorInput -> Endeavor
 *   PUT    {apiBaseUrl}/endeavors/:id   <- EndeavorInput -> Endeavor
 *   DELETE {apiBaseUrl}/endeavors/:id
 *
 * e.g. API Gateway + Lambda + DynamoDB, or any server in front of
 * RDS/Aurora. The id, createdAt and updatedAt fields are assigned by
 * the backend, not the browser.
 */
@Injectable()
export class EndeavorHttpRepository implements EndeavorRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/endeavors`;

  list(): Promise<Endeavor[]> {
    return firstValueFrom(this.http.get<Endeavor[]>(this.baseUrl));
  }

  get(id: string): Promise<Endeavor | undefined> {
    return firstValueFrom(this.http.get<Endeavor>(`${this.baseUrl}/${id}`));
  }

  create(input: EndeavorInput): Promise<Endeavor> {
    return firstValueFrom(this.http.post<Endeavor>(this.baseUrl, input));
  }

  update(id: string, input: EndeavorInput): Promise<Endeavor> {
    return firstValueFrom(this.http.put<Endeavor>(`${this.baseUrl}/${id}`, input));
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.baseUrl}/${id}`));
  }
}
