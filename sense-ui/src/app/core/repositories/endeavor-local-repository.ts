import { Injectable } from '@angular/core';
import { Endeavor, EndeavorInput } from '../../models/endeavor';
import { EndeavorRepository } from './endeavor-repository';

const STORAGE_KEY = 'sense.endeavors';

/**
 * Browser-local stand-in for the real API. Assigns ids and timestamps
 * the same way a backend would, so switching to EndeavorHttpRepository
 * later doesn't change how callers behave.
 */
@Injectable()
export class EndeavorLocalRepository implements EndeavorRepository {
  async list(): Promise<Endeavor[]> {
    return this.read();
  }

  async get(id: string): Promise<Endeavor | undefined> {
    return this.read().find((endeavor) => endeavor.id === id);
  }

  async create(input: EndeavorInput): Promise<Endeavor> {
    const now = new Date().toISOString();
    const endeavor: Endeavor = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    this.write([...this.read(), endeavor]);
    return endeavor;
  }

  async update(id: string, input: EndeavorInput): Promise<Endeavor> {
    const list = this.read();
    const updated = list.map((endeavor) =>
      endeavor.id === id
        ? { ...endeavor, ...input, updatedAt: new Date().toISOString() }
        : endeavor,
    );
    const result = updated.find((endeavor) => endeavor.id === id);
    if (!result) {
      throw new Error(`Endeavor "${id}" not found`);
    }
    this.write(updated);
    return result;
  }

  async delete(id: string): Promise<void> {
    this.write(this.read().filter((endeavor) => endeavor.id !== id));
  }

  private read(): Endeavor[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Endeavor[]) : [];
    } catch {
      return [];
    }
  }

  private write(list: Endeavor[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
}
