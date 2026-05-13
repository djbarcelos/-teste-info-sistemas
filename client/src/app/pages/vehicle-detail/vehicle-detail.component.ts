import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { Vehicle } from '../../models/vehicle.model';
import { VehicleService } from '../../services/vehicle.service';

@Component({
  selector: 'app-vehicle-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './vehicle-detail.component.html',
  styleUrl: './vehicle-detail.component.scss',
})
export class VehicleDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly vehicles = inject(VehicleService);

  protected loading = true;
  protected error: string | null = null;
  protected vehicle: Vehicle | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/vehicles']);
      return;
    }
    this.vehicles.getById(id).subscribe({
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

  protected delete(): void {
    if (!this.vehicle) return;
    if (!confirm(`Remover veículo ${this.vehicle.placa}?`)) return;
    this.vehicles.delete(this.vehicle.id).subscribe({
      next: () => this.router.navigate(['/vehicles']),
      error: (err) => {
        const e = err as { error?: { message?: string } };
        alert(e.error?.message ?? 'Erro ao remover.');
      },
    });
  }
}
