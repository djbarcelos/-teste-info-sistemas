import { Routes } from '@angular/router';
import { VehicleListComponent } from './pages/vehicle-list/vehicle-list.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'vehicles' },
  { path: 'vehicles', component: VehicleListComponent },
  { path: 'vehicles/new', redirectTo: '/vehicles', pathMatch: 'full' },
  { path: 'vehicles/:id/edit', redirectTo: '/vehicles', pathMatch: 'full' },
  { path: 'vehicles/:id', redirectTo: '/vehicles', pathMatch: 'full' },
  { path: '**', redirectTo: 'vehicles' },
];
