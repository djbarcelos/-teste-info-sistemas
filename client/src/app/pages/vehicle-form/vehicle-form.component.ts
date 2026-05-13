import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import type { CreateVehiclePayload } from '../../models/vehicle.model';
import { VehicleService } from '../../services/vehicle.service';

const maxAno = () => new Date().getFullYear() + 1;

function chassiValidator(control: AbstractControl): ValidationErrors | null {
  const v = (control.value as string)?.trim();
  if (!v) return null;
  return v.length === 17 ? null : { chassiLength: true };
}

@Component({
  selector: 'app-vehicle-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './vehicle-form.component.html',
  styleUrl: './vehicle-form.component.scss',
})
export class VehicleFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly vehicles = inject(VehicleService);

  protected readonly maxAnoVal = maxAno();
  protected mode: 'create' | 'edit' = 'create';
  protected loading = false;
  protected loadError: string | null = null;
  protected submitError: string | null = null;
  private vehicleId: string | null = null;

  protected readonly form = this.fb.nonNullable.group({
    placa: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(10)]],
    chassi: ['', [Validators.required, chassiValidator]],
    renavam: ['', [Validators.required, Validators.maxLength(20)]],
    modelo: ['', [Validators.required, Validators.maxLength(120)]],
    marca: ['', [Validators.required, Validators.maxLength(80)]],
    ano: [
      maxAno(),
      [Validators.required, Validators.min(1900), Validators.max(maxAno())],
    ],
  });

  ngOnInit(): void {
    this.mode = (this.route.snapshot.data['mode'] as 'create' | 'edit') ?? 'create';
    this.vehicleId = this.route.snapshot.paramMap.get('id');
    if (this.mode === 'edit') {
      if (!this.vehicleId) {
        this.router.navigate(['/vehicles']);
        return;
      }
      this.loading = true;
      this.vehicles.getById(this.vehicleId).subscribe({
        next: (v) => {
          this.form.patchValue({
            placa: v.placa,
            chassi: v.chassi,
            renavam: v.renavam,
            modelo: v.modelo,
            marca: v.marca,
            ano: v.ano,
          });
          this.loading = false;
        },
        error: () => {
          this.loadError = 'Não foi possível carregar o veículo.';
          this.loading = false;
        },
      });
    }
  }

  protected submit(): void {
    this.submitError = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const payload: CreateVehiclePayload = {
      placa: raw.placa.trim(),
      chassi: raw.chassi.trim(),
      renavam: raw.renavam.trim(),
      modelo: raw.modelo.trim(),
      marca: raw.marca.trim(),
      ano: raw.ano,
    };

    if (this.mode === 'create') {
      this.vehicles.create(payload).subscribe({
        next: (v) => this.router.navigate(['/vehicles', v.id]),
        error: (err) => this.setSubmitError(err),
      });
    } else if (this.vehicleId) {
      this.vehicles.update(this.vehicleId, payload).subscribe({
        next: (v) => this.router.navigate(['/vehicles', v.id]),
        error: (err) => this.setSubmitError(err),
      });
    }
  }

  private setSubmitError(err: unknown): void {
    const e = err as {
      error?: { message?: string | string[]; statusCode?: number };
      status?: number;
    };
    const msg = e.error?.message;
    this.submitError = Array.isArray(msg) ? msg.join('; ') : (msg ?? `Erro ${e.status ?? ''}`);
  }
}
