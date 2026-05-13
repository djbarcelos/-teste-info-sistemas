import { Module } from '@nestjs/common';
import { JobsModule } from './jobs/jobs.module';
import { QueuesModule } from './queues/queues.module';

@Module({
  imports: [JobsModule, QueuesModule],
})
export class WorkersModule {}