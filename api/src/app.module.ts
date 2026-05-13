import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';
import { SentryModule } from '@sentry/nestjs/setup';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import configuration from './config/configuration';
import { RabbitMQModule } from './common/rabbitmq/rabbitmq.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';
import { RoutesModule } from './modules/routes.module';
import { WorkersModule } from './workers/workers.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [configuration],
    }),
    RabbitMQModule.localConnection(),
    ScheduleModule.forRoot(),
    WorkersModule,
    PrismaModule,
    RoutesModule,
  ],
  controllers: [],
  providers: [{
    provide: APP_FILTER,
    useClass: SentryGlobalFilter,
  },
  {
    provide: APP_FILTER,
    useClass: PrismaClientExceptionFilter,
  }],
})
export class AppModule { }
