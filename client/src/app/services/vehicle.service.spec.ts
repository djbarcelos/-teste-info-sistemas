import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { VehicleService } from './vehicle.service';

describe('VehicleService', () => {
  let service: VehicleService;
  let http: HttpTestingController;
  const base = environment.apiBaseUrl.replace(/\/$/, '');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VehicleService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(VehicleService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('deve GET /v1/vehicles com query params', () => {
    service.list({ page: 2, limit: 5, search: 'Gol' }).subscribe();

    const req = http.expectOne(
      (r) =>
        r.url === `${base}/v1/vehicles` &&
        r.params.get('page') === '2' &&
        r.params.get('limit') === '5' &&
        r.params.get('search') === 'Gol',
    );
    expect(req.request.method).toBe('GET');
    req.flush({ data: [], meta: { page: 2, limit: 5, total: 0, totalPages: 0 } });
  });

  it('deve POST /v1/vehicles', () => {
    const body = {
      placa: 'ABC1D23',
      chassi: '9BWZZZ377VT004251',
      renavam: '12345678901',
      modelo: 'Gol',
      marca: 'VW',
      ano: 2024,
    };
    service.create(body).subscribe();

    const req = http.expectOne(`${base}/v1/vehicles`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ id: 'x', ...body, createdAt: '', updatedAt: '' });
  });
});
