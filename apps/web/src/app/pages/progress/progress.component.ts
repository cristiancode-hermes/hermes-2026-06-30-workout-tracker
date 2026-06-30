import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProgressService } from '../../services/progress.service';
import { LoadingSpinnerComponent } from '../../components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { ErrorDisplayComponent } from '../../components/error-display/error-display.component';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [FormsModule, LoadingSpinnerComponent, EmptyStateComponent, ErrorDisplayComponent],
  template: `
    <div class="mx-auto max-w-5xl space-y-6 p-4 pb-20 lg:pb-4 lg:pl-0">
      <h1 class="text-2xl font-bold text-surface-900 dark:text-white">Progress</h1>

      <!-- Add Entry Form -->
      <div class="rounded-xl bg-white p-6 shadow-sm dark:bg-surface-800">
        <h2 class="mb-4 text-lg font-semibold text-surface-900 dark:text-white">Log New Entry</h2>

        @if (progressService.error(); as err) {
          <div class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">{{ err }}</div>
        }

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">Date</label>
            <input
              type="date"
              [(ngModel)]="entryDate"
              class="w-full rounded-lg border border-surface-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              [(ngModel)]="entryWeight"
              class="w-full rounded-lg border border-surface-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
              placeholder="e.g. 75.5"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">Body Fat (%)</label>
            <input
              type="number"
              step="0.1"
              [(ngModel)]="entryBodyFat"
              class="w-full rounded-lg border border-surface-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
              placeholder="e.g. 15.5"
            />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium text-surface-700 dark:text-surface-300">Notes</label>
            <input
              type="text"
              [(ngModel)]="entryNotes"
              class="w-full rounded-lg border border-surface-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-800 dark:text-white"
              placeholder="Any notes..."
            />
          </div>
        </div>
        <button
          (click)="addEntry()"
          [disabled]="progressService.isLoading()"
          class="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {{ progressService.isLoading() ? 'Adding...' : 'Add Entry' }}
        </button>
      </div>

      <!-- Weight Trend Chart -->
      @if (sortedEntries().length > 1) {
        <div class="rounded-xl bg-white p-6 shadow-sm dark:bg-surface-800">
          <h2 class="mb-4 text-lg font-semibold text-surface-900 dark:text-white">Weight Trend</h2>
          <svg [attr.viewBox]="'0 0 ' + chartWidth + ' ' + chartHeight" class="w-full max-h-64">
            <!-- Grid lines -->
            @for (y of yGridLines(); track y) {
              <line [attr.x1]="0" [attr.y1]="y" [attr.x2]="chartWidth" [attr.y2]="y" stroke="currentColor" class="text-surface-200 dark:text-surface-700" stroke-width="1" />
            }
            <!-- Weight line -->
            <polyline
              [attr.points]="weightPoints()"
              fill="none"
              stroke="#0c8ee7"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <!-- Dots -->
            @for (pt of weightPointsList(); track $index) {
              <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="4" fill="#0c8ee7" class="cursor-pointer">
                <title>{{ pt.label }}</title>
              </circle>
            }
            <!-- Y-axis labels -->
            @for (label of yAxisLabels(); track label.value) {
              <text x="-5" [attr.y]="label.y" text-anchor="end" class="fill-surface-400 text-[10px]">{{ label.value }}kg</text>
            }
            <!-- X-axis labels -->
            @for (label of xAxisLabels(); track label.index) {
              <text [attr.x]="label.x" y="280" text-anchor="middle" class="fill-surface-400 text-[10px]">{{ label.text }}</text>
            }
          </svg>
        </div>

        <!-- Body Fat Trend Chart -->
        @if (hasBodyFatData()) {
          <div class="rounded-xl bg-white p-6 shadow-sm dark:bg-surface-800">
            <h2 class="mb-4 text-lg font-semibold text-surface-900 dark:text-white">Body Fat Trend</h2>
            <svg [attr.viewBox]="'0 0 ' + chartWidth + ' ' + chartHeight" class="w-full max-h-64">
              <!-- Grid lines -->
              @for (y of bfYGridLines(); track y) {
                <line [attr.x1]="0" [attr.y1]="y" [attr.x2]="chartWidth" [attr.y2]="y" stroke="currentColor" class="text-surface-200 dark:text-surface-700" stroke-width="1" />
              }
              <!-- Body fat line -->
              <polyline
                [attr.points]="bodyFatPoints()"
                fill="none"
                stroke="#e11d48"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <!-- Dots -->
              @for (pt of bodyFatPointsList(); track $index) {
                <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="4" fill="#e11d48" class="cursor-pointer">
                  <title>{{ pt.label }}</title>
                </circle>
              }
              <!-- Y-axis labels -->
              @for (label of bfYAxisLabels(); track label.value) {
                <text x="-5" [attr.y]="label.y" text-anchor="end" class="fill-surface-400 text-[10px]">{{ label.value }}%</text>
              }
              <!-- X-axis labels -->
              @for (label of xAxisLabels(); track label.index) {
                <text [attr.x]="label.x" y="280" text-anchor="middle" class="fill-surface-400 text-[10px]">{{ label.text }}</text>
              }
            </svg>
          </div>
        }
      }

      <!-- Entries Table -->
      @if (progressService.isLoading()) {
        <app-loading-spinner />
      } @else if (progressService.error(); as err) {
        <app-error-display [message]="err" (retry)="progressService.loadEntries()" />
      } @else if (sortedEntries().length === 0) {
        <app-empty-state icon="📊" message="No progress entries yet" actionLabel="Add First Entry" (action)="focusEntryDate()" />
      } @else {
        <div class="rounded-xl bg-white p-6 shadow-sm dark:bg-surface-800">
          <h2 class="mb-4 text-lg font-semibold text-surface-900 dark:text-white">All Entries</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead>
                <tr class="border-b border-surface-200 dark:border-surface-700">
                  <th class="pb-2 font-medium text-surface-500 dark:text-surface-400">Date</th>
                  <th class="pb-2 font-medium text-surface-500 dark:text-surface-400">Weight</th>
                  <th class="pb-2 font-medium text-surface-500 dark:text-surface-400">Body Fat</th>
                  <th class="pb-2 font-medium text-surface-500 dark:text-surface-400">Notes</th>
                </tr>
              </thead>
              <tbody>
                @for (e of sortedEntries(); track e.id) {
                  <tr class="border-b border-surface-100 dark:border-surface-700/50">
                    <td class="py-3 text-surface-900 dark:text-white">{{ formatDate(e.date) }}</td>
                    <td class="py-3 font-medium text-surface-900 dark:text-white">{{ e.weight }} kg</td>
                    <td class="py-3 text-surface-600 dark:text-surface-400">{{ e.bodyFat ? e.bodyFat + '%' : '—' }}</td>
                    <td class="py-3 text-surface-500 dark:text-surface-400">{{ e.notes || '—' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
})
export class ProgressComponent implements OnInit {
  protected readonly progressService = inject(ProgressService);

  protected readonly entryDate = signal(new Date().toISOString().split('T')[0]);
  protected readonly entryWeight = signal(0);
  protected readonly entryBodyFat = signal(0);
  protected readonly entryNotes = signal('');

  protected readonly chartWidth = 600;
  protected readonly chartHeight = 250;
  protected readonly padding = { top: 20, right: 20, bottom: 40, left: 50 };

  protected readonly sortedEntries = computed(() => {
    return [...this.progressService.entries()].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  });

  protected readonly hasBodyFatData = computed(() => {
    return this.sortedEntries().some((e) => e.bodyFat > 0);
  });

  protected readonly weightValues = computed(() => this.sortedEntries().map((e) => e.weight));
  protected readonly bodyFatValues = computed(() => this.sortedEntries().map((e) => e.bodyFat));

  protected readonly minWeight = computed(() => Math.floor(Math.min(...this.weightValues()) - 2));
  protected readonly maxWeight = computed(() => Math.ceil(Math.max(...this.weightValues()) + 2));
  protected readonly minBodyFat = computed(() => {
    const vals = this.bodyFatValues().filter((v) => v > 0);
    return vals.length ? Math.floor(Math.min(...vals) - 1) : 0;
  });
  protected readonly maxBodyFat = computed(() => {
    const vals = this.bodyFatValues().filter((v) => v > 0);
    return vals.length ? Math.ceil(Math.max(...vals) + 1) : 30;
  });

  protected readonly plotWidth = computed(() => this.chartWidth - this.padding.left - this.padding.right);
  protected readonly plotHeight = computed(() => this.chartHeight - this.padding.top - this.padding.bottom);

  private makePoints(data: number[], yMin: number, yMax: number): { points: string; pointList: { x: number; y: number; label: string }[] } {
    const entries = this.sortedEntries();
    const pw = this.plotWidth();
    const ph = this.plotHeight();
    const pt = this.padding.top;
    const pl = this.padding.left;
    const range = yMax - yMin || 1;

    let points = '';
    const pointList: { x: number; y: number; label: string }[] = [];

    entries.forEach((entry, i) => {
      const x = pl + (i / Math.max(entries.length - 1, 1)) * pw;
      const y = pt + ph - ((data[i] - yMin) / range) * ph;
      points += `${x},${y} `;
      pointList.push({ x, y, label: `${entry.date}: ${data[i]}${data === this.weightValues() ? 'kg' : '%'}` });
    });

    return { points: points.trim(), pointList };
  }

  protected readonly weightPoints = computed(() => this.makePoints(this.weightValues(), this.minWeight(), this.maxWeight()).points);
  protected readonly weightPointsList = computed(() => this.makePoints(this.weightValues(), this.minWeight(), this.maxWeight()).pointList);
  protected readonly bodyFatPoints = computed(() => this.makePoints(this.bodyFatValues(), this.minBodyFat(), this.maxBodyFat()).points);
  protected readonly bodyFatPointsList = computed(() => this.makePoints(this.bodyFatValues(), this.minBodyFat(), this.maxBodyFat()).pointList);

  protected readonly yGridLines = computed(() => {
    const lines: number[] = [];
    const ph = this.plotHeight();
    const pt = this.padding.top;
    const range = this.maxWeight() - this.minWeight();
    const step = range / 4 || 1;
    for (let i = 0; i <= 4; i++) {
      lines.push(pt + ph - (i / 4) * ph);
    }
    return lines;
  });

  protected readonly bfYGridLines = computed(() => {
    const lines: number[] = [];
    const ph = this.plotHeight();
    const pt = this.padding.top;
    const range = this.maxBodyFat() - this.minBodyFat();
    const step = range / 4 || 1;
    for (let i = 0; i <= 4; i++) {
      lines.push(pt + ph - (i / 4) * ph);
    }
    return lines;
  });

  protected readonly yAxisLabels = computed(() => {
    const labels: { value: number; y: number }[] = [];
    const ph = this.plotHeight();
    const pt = this.padding.top;
    const range = this.maxWeight() - this.minWeight();
    for (let i = 0; i <= 4; i++) {
      const value = Math.round((this.minWeight() + (i / 4) * range) * 10) / 10;
      labels.push({ value, y: pt + ph - (i / 4) * ph + 4 });
    }
    return labels;
  });

  protected readonly bfYAxisLabels = computed(() => {
    const labels: { value: number; y: number }[] = [];
    const ph = this.plotHeight();
    const pt = this.padding.top;
    const range = this.maxBodyFat() - this.minBodyFat();
    for (let i = 0; i <= 4; i++) {
      const value = Math.round((this.minBodyFat() + (i / 4) * range) * 10) / 10;
      labels.push({ value, y: pt + ph - (i / 4) * ph + 4 });
    }
    return labels;
  });

  protected readonly xAxisLabels = computed(() => {
    const entries = this.sortedEntries();
    const count = entries.length;
    const maxLabels = 6;
    const step = Math.max(1, Math.floor(count / maxLabels));
    const labels: { index: number; x: number; text: string }[] = [];
    const pw = this.plotWidth();
    const pl = this.padding.left;

    entries.forEach((entry, i) => {
      if (i % step === 0 || i === count - 1) {
        const x = pl + (i / Math.max(count - 1, 1)) * pw;
        const d = new Date(entry.date);
        labels.push({ index: i, x, text: `${d.getMonth() + 1}/${d.getDate()}` });
      }
    });

    return labels;
  });

  ngOnInit(): void {
    this.progressService.loadEntries();
  }

  protected addEntry(): void {
    this.progressService.addEntry({
      date: this.entryDate(),
      weight: this.entryWeight(),
      bodyFat: this.entryBodyFat(),
      notes: this.entryNotes(),
    });
    this.entryWeight.set(0);
    this.entryBodyFat.set(0);
    this.entryNotes.set('');
  }

  protected formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  protected focusEntryDate(): void {
    this.entryDate.set(new Date().toISOString().split('T')[0]);
  }
}
