import { Module } from '@nestjs/common';
import { PingModule } from './ping/ping.module';
import { VehiclesModule } from './vehicles/vehicles.module';

@Module({
    imports: [PingModule, VehiclesModule],
    controllers: [],
    providers: [],
})
export class RoutesModule { }