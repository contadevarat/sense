import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EndeavorStore } from '../../../core/endeavor-store';
import { ENDEAVOR_CATEGORIES, ENDEAVOR_STATUSES } from '../../../models/endeavor';

@Component({
  selector: 'app-endeavor-list',
  imports: [RouterLink],
  templateUrl: './endeavor-list.html',
  styleUrl: './endeavor-list.css',
})
export class EndeavorList {
  private readonly store = inject(EndeavorStore);

  readonly endeavors = this.store.all;
  readonly loading = this.store.loading;
  readonly error = this.store.error;

  statusLabel(value: string): string {
    return ENDEAVOR_STATUSES.find((s) => s.value === value)?.label ?? value;
  }

  categoryLabel(value: string): string {
    return ENDEAVOR_CATEGORIES.find((c) => c.value === value)?.label ?? value;
  }

  async remove(id: string, name: string, event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) {
      return;
    }
    try {
      await this.store.delete(id);
    } catch (err) {
      alert('Could not delete this endeavor. Please try again.');
      console.error(err);
    }
  }
}
