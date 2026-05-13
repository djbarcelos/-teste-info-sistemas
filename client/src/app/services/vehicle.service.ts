import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type {
  CreateVehiclePayload,
  PaginatedVehicles,
  UpdateVehiclePayload,
  Vehicle,
} from '../models/vehicle.model';

@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl.replace(/\/$/, '');
  private readonly vehiclesPath = `${this.base}/v1/vehicles`;

  list(params: {
    page?: number;
    limit?: number;
    search?: string;
  }): Observable<PaginatedVehicles> {
    let httpParams = new HttpParams();
    if (params.page != null) {
      httpParams = httpParams.set('page', String(params.page));
    }
    if (params.limit != null) {
      httpParams = httpParams.set('limit', String(params.limit));
    }
    if (params.search?.trim()) {
      httpParams = httpParams.set('search', params.search.trim());
    }
    return this.http.get<PaginatedVehicles>(this.vehiclesPath, {
      params: httpParams,
    });
  }

  getById(id: string): Observable<Vehicle> {
    return this.http.get<Vehicle>(`${this.vehiclesPath}/${id}`);
  }

  create(body: CreateVehiclePayload): Observable<Vehicle> {
    return this.http.post<Vehicle>(this.vehiclesPath, body);
  }

  update(id: string, body: UpdateVehiclePayload): Observable<Vehicle> {
    return this.http.patch<Vehicle>(`${this.vehiclesPath}/${id}`, body);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.vehiclesPath}/${id}`);
  }
}
