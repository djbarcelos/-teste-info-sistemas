import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { VehicleDetailModalComponent } from '../../components/vehicle-detail-modal/vehicle-detail-modal.component';
import {
  VehicleFormModalComponent,
  type VehicleFormModalMode,
} from '../../components/vehicle-form-modal/vehicle-form-modal.component';
import type { PaginatedVehicles, Vehicle } from '../../models/vehicle.model';
import { VehicleService } from '../../services/vehicle.service';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [CommonModule, FormsModule, VehicleFormModalComponent, VehicleDetailModalComponent],
  templateUrl: './vehicle-list.component.html',
  styleUrl: './vehicle-list.component.scss',
})
export class VehicleListComponent implements OnInit, OnDestroy {
  private readonly vehicles = inject(VehicleService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private searchDebounce?: ReturnType<typeof setTimeout>;
  private querySub?: Subscription;

  protected loading = true;
  protected error: string | null = null;
  protected result: PaginatedVehicles | null = null;

  protected page = 1;
  protected limit = 10;
  protected searchInput = '';

  protected formModalOpen = false;
  protected formModalMode: VehicleFormModalMode = 'create';
  protected formModalVehicleId: string | null = null;

  protected detailModalOpen = false;
  protected detailVehicleId: string | null = null;

  protected openMenuVehicleId: string | null = null;

  ngOnInit(): void {
    this.querySub = this.route.queryParams.subscribe((params) => {
      if (params['criar'] === '1') {
        this.openCreateModal();
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true,
        });
      }
    });
    this.load();
  }

  ngOnDestroy(): void {
    clearTimeout(this.searchDebounce);
    this.querySub?.unsubscribe();
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.openMenuVehicleId = null;
  }

  protected toggleMenu(vehicleId: string, event: MouseEvent): void {
    event.stopPropagation();
    this.openMenuVehicleId = this.openMenuVehicleId === vehicleId ? null : vehicleId;
  }

  protected openCreateModal(): void {
    this.formModalMode = 'create';
    this.formModalVehicleId = null;
    this.formModalOpen = true;
  }

  protected openEditModal(v: Vehicle): void {
    this.openMenuVehicleId = null;
    this.formModalMode = 'edit';
    this.formModalVehicleId = v.id;
    this.formModalOpen = true;
  }

  protected openDetailModal(v: Vehicle): void {
    this.openMenuVehicleId = null;
    this.detailVehicleId = v.id;
    this.detailModalOpen = true;
  }

  protected onEditFromDetail(vehicleId: string): void {
    this.detailModalOpen = false;
    this.formModalMode = 'edit';
    this.formModalVehicleId = vehicleId;
    this.formModalOpen = true;
  }

  protected deleteVehicle(v: Vehicle): void {
    this.openMenuVehicleId = null;
    if (!confirm(`Remover veículo ${v.placa}?`)) return;
    this.vehicles.delete(v.id).subscribe({
      next: () => {
        this.page = 1;
        this.load();
      },
      error: (err) => {
        const e = err as { error?: { message?: string } };
        alert(e.error?.message ?? 'Erro ao remover.');
      },
    });
  }

  protected onVehicleSaved(): void {
    this.page = 1;
    this.load();
  }

  protected onVehicleDeletedFromDetail(): void {
    this.page = 1;
    this.load();
  }

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
