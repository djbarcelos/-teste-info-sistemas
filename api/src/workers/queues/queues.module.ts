import { Module } from '@nestjs/common';
import { VehicleEventsWorker } from './vehicle-events.worker';

@Module({
  providers: [VehicleEventsWorker],
})
export class QueuesModule {}