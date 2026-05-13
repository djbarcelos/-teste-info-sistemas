import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  Component,
  HostListener,
  Input,
  OnChanges,
  Output,
  EventEmitter,
  SimpleChanges,
  inject,
} from '@angular/core';
import type { CreateVehiclePayload } from '../../models/vehicle.model';
import { VehicleService } from '../../services/vehicle.service';
import { defaultVehicleModelYear, vehicleYearChoices } from '../../utils/vehicle-years';

const maxAno = () => new Date().getFullYear() + 1;

function chassiValidator(control: AbstractControl): ValidationErrors | null {
  const v = (control.value as string)?.trim();
  if (!v) return null;
  return v.length === 17 ? null : { chassiLength: true };
}

export type VehicleFormModalMode = 'create' | 'edit';

@Component({
  selector: 'app-vehicle-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './vehicle-form-modal.component.html',
  styleUrl: './vehicle-form-modal.component.scss',
})
export class VehicleFormModalComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly vehicles = inject(VehicleService);

  @Input({ required: true }) open = false;
  @Input() mode: VehicleFormModalMode = 'create';
  @Input() vehicleId: string | null = null;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<void>();

  protected readonly yearChoices = vehicleYearChoices();
  protected submitting = false;
  protected loadingVehicle = false;
  protected submitError: string | null = null;
  protected loadError: string | null = null;

  protected readonly form = this.fb.nonNullable.group({
    placa: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(10)]],
    chassi: ['', [Validators.required, chassiValidator]],
    renavam: ['', [Validators.required, Validators.maxLength(20)]],
    modelo: ['', [Validators.required, Validators.maxLength(120)]],
    marca: ['', [Validators.required, Validators.maxLength(80)]],
    ano: [
      defaultVehicleModelYear(),
      [Validators.required, Validators.min(1900), Validators.max(maxAno())],
    ],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.open) return;
    if (changes['open']?.currentValue === true) {
      this.onOpened();
    }
    if (
      this.mode === 'edit' &&
      this.vehicleId &&
      changes['vehicleId'] &&
      !changes['vehicleId'].firstChange &&
      this.open
    ) {
      this.loadVehicle();
    }
  }

  private onOpened(): void {
    this.submitError = null;
    this.loadError = null;
    if (this.mode === 'create') {
      this.loadingVehicle = false;
      this.reset();
    } else if (this.vehicleId) {
      this.loadVehicle();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) {
      this.dismiss();
    }
  }

  protected dismiss(): void {
    if (this.submitting || this.loadingVehicle) return;
    this.openChange.emit(false);
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
      ano: Number(raw.ano),
    };

    this.submitting = true;
    if (this.mode === 'create') {
      this.vehicles.create(payload).subscribe({
        next: () => this.afterSaveSuccess(),
        error: (err) => this.afterSaveError(err),
      });
    } else if (this.vehicleId) {
      this.vehicles.update(this.vehicleId, payload).subscribe({
        next: () => this.afterSaveSuccess(),
        error: (err) => this.afterSaveError(err),
      });
    } else {
      this.submitting = false;
    }
  }

  private afterSaveSuccess(): void {
    this.submitting = false;
    this.saved.emit();
    this.openChange.emit(false);
    if (this.mode === 'create') {
      this.reset();
    }
  }

  private afterSaveError(err: unknown): void {
    this.submitting = false;
    const e = err as {
      error?: { message?: string | string[] };
      status?: number;
    };
    const msg = e.error?.message;
    this.submitError = Array.isArray(msg) ? msg.join('; ') : (msg ?? `Erro ${e.status ?? ''}`);
  }

  private loadVehicle(): void {
    if (!this.vehicleId) return;
    this.loadingVehicle = true;
    this.loadError = null;
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
        this.loadingVehicle = false;
      },
      error: () => {
        this.loadingVehicle = false;
        this.loadError = 'Não foi possível carregar o veículo.';
      },
    });
  }

  private reset(): void {
    this.form.reset({
      placa: '',
      chassi: '',
      renavam: '',
      modelo: '',
      marca: '',
      ano: defaultVehicleModelYear(),
    });
    this.submitError = null;
  }
}
