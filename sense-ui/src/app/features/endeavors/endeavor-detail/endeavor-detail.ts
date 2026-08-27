import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { EndeavorStore } from '../../../core/endeavor-store';
import { EndeavorFileRepository } from '../../../core/repositories/endeavor-file-repository';
import { ENDEAVOR_CATEGORIES, ENDEAVOR_STATUSES } from '../../../models/endeavor';
import {
  ACCEPTED_FILE_EXTENSIONS,
  ACCEPTED_FILE_TYPES,
  EndeavorFile,
} from '../../../models/endeavor-file';

@Component({
  selector: 'app-endeavor-detail',
  imports: [RouterLink, DatePipe],
  templateUrl: './endeavor-detail.html',
  styleUrl: './endeavor-detail.css',
})
export class EndeavorDetail {
  private readonly store = inject(EndeavorStore);
  private readonly fileRepository = inject(EndeavorFileRepository);
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

  readonly acceptedFileTypes = ACCEPTED_FILE_EXTENSIONS.join(',');
  readonly files = signal<EndeavorFile[]>([]);
  readonly filesLoading = signal(false);
  readonly filesError = signal<string | null>(null);
  readonly uploadingNames = signal<string[]>([]);
  readonly removingIds = signal<string[]>([]);
  readonly isDragging = signal(false);

  private loadedFor: string | null = null;

  constructor() {
    effect(() => {
      const id = this.id();
      if (id && id !== this.loadedFor) {
        this.loadedFor = id;
        this.loadFiles(id);
      }
    });
  }

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

  onFilesSelected(fileInput: HTMLInputElement): void {
    if (fileInput.files) {
      this.uploadFiles(fileInput.files);
    }
    fileInput.value = '';
  }

  onFilesDropped(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    if (event.dataTransfer?.files) {
      this.uploadFiles(event.dataTransfer.files);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(): void {
    this.isDragging.set(false);
  }

  async removeFile(fileId: string): Promise<void> {
    const endeavorId = this.id();
    this.removingIds.update((ids) => [...ids, fileId]);
    try {
      await this.fileRepository.delete(endeavorId, fileId);
      this.files.update((list) => list.filter((f) => f.id !== fileId));
    } catch (err) {
      this.filesError.set('Could not remove this file. Please try again.');
      console.error(err);
    } finally {
      this.removingIds.update((ids) => ids.filter((id) => id !== fileId));
    }
  }

  isRemoving(fileId: string): boolean {
    return this.removingIds().includes(fileId);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  fileTypeLabel(contentType: string): string {
    switch (contentType) {
      case 'application/pdf':
        return 'PDF';
      case 'image/jpeg':
        return 'JPG';
      case 'image/png':
        return 'PNG';
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return 'DOC';
      default:
        return 'FILE';
    }
  }

  private async loadFiles(endeavorId: string): Promise<void> {
    this.filesLoading.set(true);
    this.filesError.set(null);
    try {
      this.files.set(await this.fileRepository.list(endeavorId));
    } catch (err) {
      this.filesError.set('Could not load files. Please try again.');
      console.error(err);
    } finally {
      this.filesLoading.set(false);
    }
  }

  private async uploadFiles(fileList: FileList): Promise<void> {
    const endeavorId = this.id();
    const accepted: File[] = [];
    const rejected: string[] = [];

    // chek file is accepted format
    for (const file of Array.from(fileList)) {
      if (ACCEPTED_FILE_TYPES.includes(file.type as (typeof ACCEPTED_FILE_TYPES)[number])) {
        accepted.push(file);
      } else {
        rejected.push(file.name);
      }
    }

    this.filesError.set(
      rejected.length > 0
        ? `${rejected.join(', ')} - unsupported file type. Allowed: PDF, JPEG, PNG, DOC, DOCX.`
        : null,
    );

    if (accepted.length === 0) return;

    
    this.uploadingNames.update((names) => [...names, ...accepted.map((f) => f.name)]);
    await Promise.all(
      accepted.map(async (file) => {
        try {
          const uploaded = await this.fileRepository.upload(endeavorId, file);
          this.files.update((list) => [uploaded, ...list]);
        } catch (err) {
          this.filesError.set(`Could not upload "${file.name}". Please try again.`);
          console.error(err);
        } finally {
          this.uploadingNames.update((names) => names.filter((n) => n !== file.name));
        }
      }),
    );
  }
}
