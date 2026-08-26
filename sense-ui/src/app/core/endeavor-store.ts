import { Injectable, computed, inject, signal } from '@angular/core';
import { Endeavor, EndeavorInput } from '../models/endeavor';
import { EndeavorRepository } from './repositories/endeavor-repository';

@Injectable({ providedIn: 'root' })
export class EndeavorStore {
  private readonly repository = inject(EndeavorRepository);

  private readonly endeavors = signal<Endeavor[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly all = computed(() =>
    [...this.endeavors()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  );

  constructor() {
    this.refresh();
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.endeavors.set(await this.repository.list());
    } catch (err) {
      this.error.set('Could not load endeavors. Please try again.');
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  find(id: string): Endeavor | undefined {
    return this.endeavors().find((endeavor) => endeavor.id === id);
  }

  async create(input: EndeavorInput): Promise<Endeavor> {
    const created = await this.repository.create(input);
    this.endeavors.update((list) => [...list, created]);
    return created;
  }

  async update(id: string, input: EndeavorInput): Promise<Endeavor> {
    const updated = await this.repository.update(id, input);
    this.endeavors.update((list) => list.map((e) => (e.id === id ? updated : e)));
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
    this.endeavors.update((list) => list.filter((e) => e.id !== id));
  }
}
