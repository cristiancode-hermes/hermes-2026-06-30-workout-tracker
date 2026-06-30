import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ProgressEntry, ProgressCreateRequest } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly http = inject(HttpClient);

  readonly entries = signal<ProgressEntry[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  loadEntries(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.get<ProgressEntry[]>('/api/progress').subscribe({
      next: (data) => {
        this.entries.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.error.set('Failed to load progress entries');
      },
    });
  }

  addEntry(entry: ProgressCreateRequest): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.http.post<ProgressEntry>('/api/progress', entry).subscribe({
      next: (data) => {
        this.entries.update((list) => [...list, data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.error.set('Failed to add progress entry');
      },
    });
  }
}
