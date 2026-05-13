import { Routes } from '@angular/router';
import { VehicleDetailComponent } from './pages/vehicle-detail/vehicle-detail.component';
import { VehicleFormComponent } from './pages/vehicle-form/vehicle-form.component';
import { VehicleListComponent } from './pages/vehicle-list/vehicle-list.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'vehicles' },
  { path: 'vehicles', component: VehicleListComponent },
  {
    path: 'vehicles/new',
    component: VehicleFormComponent,
    data: { mode: 'create' },
  },
  {
    path: 'vehicles/:id/edit',
    component: VehicleFormComponent,
    data: { mode: 'edit' },
  },
  { path: 'vehicles/:id', component: VehicleDetailComponent },
  { path: '**', redirectTo: 'vehicles' },
];
