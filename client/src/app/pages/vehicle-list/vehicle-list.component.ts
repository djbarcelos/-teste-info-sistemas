import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { PaginatedVehicles } from '../../models/vehicle.model';
import { VehicleService } from '../../services/vehicle.service';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './vehicle-list.component.html',
  styleUrl: './vehicle-list.component.scss',
})
export class VehicleListComponent implements OnInit, OnDestroy {
  private readonly vehicles = inject(VehicleService);
  private searchDebounce?: ReturnType<typeof setTimeout>;

  protected loading = true;
  protected error: string | null = null;
  protected result: PaginatedVehicles | null = null;

  protected page = 1;
  protected limit = 10;
  protected searchInput = '';

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    clearTimeout(this.searchDebounce);
  }

  /** Debounce leve ao digitar na busca (reinicia na página 1). */
  protected onSearchInput(): void {
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.page = 1;
      this.load();
    }, 400);
  }

  protected load(): void {
    this.loading = true;
    this.error = null;
    this.vehicles
      .list({
        page: this.page,
        limit: this.limit,
        search: this.searchInput.trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.result = res;
          this.loading = false;
        },
        error: (err) => this.handleError(err),
      });
  }

  protected goToPage(p: number): void {
    if (!this.result) return;
    if (p < 1 || p > this.result.meta.totalPages) return;
    this.page = p;
    this.load();
  }

  private handleError(err: unknown): void {
    this.loading = false;
    this.result = null;
    const e = err as { error?: { message?: string }; message?: string; status?: number };
    this.error =
      e.error?.message ??
      e.message ??
      (e.status ? `Erro HTTP ${e.status}` : 'Falha ao comunicar com a API.');
  }
}
