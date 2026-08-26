import { DatePipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { EndeavorStore } from '../../../core/endeavor-store';
import { ENDEAVOR_CATEGORIES, ENDEAVOR_STATUSES } from '../../../models/endeavor';

@Component({
  selector: 'app-endeavor-detail',
  imports: [RouterLink, DatePipe],
  templateUrl: './endeavor-detail.html',
  styleUrl: './endeavor-detail.css',
})
export class EndeavorDetail {
  private readonly store = inject(EndeavorStore);
  private readonly router = inject(Router);

  readonly id = input.required<string>();
  readonly endeavor = computed(() => this.store.find(this.id()));
  readonly loading = this.store.loading;
  readonly notFound = computed(() => !this.loading() && !this.endeavor());

  readonly statusLabel = computed(
    () => ENDEAVOR_STATUSES.find((s) => s.value === this.endeavor()?.status)?.label,
  );
  readonly categoryLabel = computed(
    () => ENDEAVOR_CATEGORIES.find((c) => c.value === this.endeavor()?.category)?.label,
  );

  async remove(): Promise<void> {
    const endeavor = this.endeavor();
    if (!endeavor) return;
    if (!confirm(`Delete "${endeavor.name}"? This cannot be undone.`)) {
      return;
    }
    try {
      await this.store.delete(endeavor.id);
      this.router.navigate(['/endeavors']);
    } catch (err) {
      alert('Could not delete this endeavor. Please try again.');
      console.error(err);
    }
  }
}
