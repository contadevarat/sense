import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { EndeavorStore } from '../../../core/endeavor-store';
import {
  ENDEAVOR_CATEGORIES,
  ENDEAVOR_PRIORITIES,
  ENDEAVOR_STATUSES,
  EndeavorCategory,
  EndeavorInput,
  EndeavorPriority,
  EndeavorStatus,
} from '../../../models/endeavor';

@Component({
  selector: 'app-endeavor-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './endeavor-form.html',
  styleUrl: './endeavor-form.css',
})
export class EndeavorForm {
  private readonly store = inject(EndeavorStore);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly id = input<string>();
  readonly existing = computed(() => {
    const id = this.id();
    return id ? this.store.find(id) : undefined;
  });
  readonly isEditMode = computed(() => !!this.id());
  readonly loading = this.store.loading;
  readonly notFound = computed(() => this.isEditMode() && !this.loading() && !this.existing());
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);

  readonly statuses = ENDEAVOR_STATUSES;
  readonly priorities = ENDEAVOR_PRIORITIES;
  readonly categories = ENDEAVOR_CATEGORIES;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    summary: ['', Validators.maxLength(200)],
    description: [''],
    category: this.fb.nonNullable.control<EndeavorCategory>('personal', Validators.required),
    status: this.fb.nonNullable.control<EndeavorStatus>('planning', Validators.required),
    priority: this.fb.nonNullable.control<EndeavorPriority>('medium', Validators.required),
    keywords: [''],
    startDate: [''],
    targetDate: [''],
    newsMonitoringEnabled: [true],
  });

  private patched = false;

  constructor() {
    effect(() => {
      const endeavor = this.existing();
      if (endeavor && !this.patched) {
        this.patched = true;
        this.form.patchValue({
          name: endeavor.name,
          summary: endeavor.summary,
          description: endeavor.description,
          category: endeavor.category,
          status: endeavor.status,
          priority: endeavor.priority,
          keywords: endeavor.keywords.join(', '),
          startDate: endeavor.startDate ?? '',
          targetDate: endeavor.targetDate ?? '',
          newsMonitoringEnabled: endeavor.newsMonitoringEnabled,
        });
      }
    });
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const input: EndeavorInput = {
      name: value.name.trim(),
      summary: value.summary.trim(),
      description: value.description.trim(),
      category: value.category,
      status: value.status,
      priority: value.priority,
      keywords: value.keywords
        .split(',')
        .map((k) => k.trim())
        .filter((k) => k.length > 0),
      startDate: value.startDate || null,
      targetDate: value.targetDate || null,
      newsMonitoringEnabled: value.newsMonitoringEnabled,
    };

    this.saving.set(true);
    this.saveError.set(null);
    try {
      const id = this.id();
      if (id) {
        await this.store.update(id, input);
        this.router.navigate(['/endeavors', id]);
      } else {
        const created = await this.store.create(input);
        this.router.navigate(['/endeavors', created.id]);
      }
    } catch (err) {
      this.saveError.set('Could not save this endeavor. Please try again.');
      console.error(err);
    } finally {
      this.saving.set(false);
    }
  }
}
