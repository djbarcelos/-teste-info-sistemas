import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import type { Vehicle } from '../../models/vehicle.model';
import { VehicleService } from '../../services/vehicle.service';

@Component({
  selector: 'app-vehicle-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehicle-detail-modal.component.html',
  styleUrl: './vehicle-detail-modal.component.scss',
})
export class VehicleDetailModalComponent implements OnChanges {
  private readonly vehicles = inject(VehicleService);

  @Input({ required: true }) open = false;
  @Input() vehicleId: string | null = null;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() deleted = new EventEmitter<void>();
  @Output() editRequested = new EventEmitter<string>();

  protected loading = true;
  protected error: string | null = null;
  protected vehicle: Vehicle | null = null;
  protected deleting = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.open) return;
    if (changes['open']?.currentValue === true && this.vehicleId) {
      this.fetch();
    }
    if (
      this.open &&
      this.vehicleId &&
      changes['vehicleId'] &&
      !changes['vehicleId'].firstChange
    ) {
      this.fetch();
    }
  }

  private fetch(): void {
    if (!this.vehicleId) return;
    this.loading = true;
    this.error = null;
    this.vehicle = null;
    this.vehicles.getById(this.vehicleId).subscribe({
      next: (v) => {
        this.vehicle = v;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        const e = err as { error?: { message?: string }; status?: number };
        this.error =
          e.error?.message ??
          (e.status === 404 ? 'Veículo não encontrado.' : 'Não foi possível carregar o veículo.');
      },
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) {
      this.dismiss();
    }
  }

  protected dismiss(): void {
    if (this.deleting) return;
    this.openChange.emit(false);
  }

  protected requestEdit(): void {
    if (!this.vehicle) return;
    this.editRequested.emit(this.vehicle.id);
    this.openChange.emit(false);
  }

  protected delete(): void {
    if (!this.vehicle || this.deleting) return;
    if (!confirm(`Remover veículo ${this.vehicle.placa}?`)) return;
    this.deleting = true;
    this.vehicles.delete(this.vehicle.id).subscribe({
      next: () => {
        this.deleting = false;
        this.deleted.emit();
        this.openChange.emit(false);
        this.vehicle = null;
      },
      error: (err) => {
        this.deleting = false;
        const e = err as { error?: { message?: string } };
        alert(e.error?.message ?? 'Erro ao remover.');
      },
    });
  }
}
