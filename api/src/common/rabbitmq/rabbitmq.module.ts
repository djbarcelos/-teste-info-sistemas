import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  AmqpConnection,
  MessageHandlerErrorBehavior,
  RabbitMQModule as RabbitMQModuleNest,
} from '@golevelup/nestjs-rabbitmq';
import { RabbitMQService } from './rabbitmq.service';
import { buildRabbitUrl } from '../../config/rabbitmq';
import { RABBITMQ_EXCHANGES, RABBITMQ_QUEUES } from './rabbitmq-queues';

@Global()
@Module({})
export class RabbitMQModule {
  static forRootAsync(): DynamicModule {
    return {
      module: RabbitMQModule,
      global: true,
      imports: [
        ConfigModule,
        RabbitMQModuleNest.forRootAsync({
          imports: [ConfigModule],
          useFactory: (config: ConfigService) => ({
            uri: buildRabbitUrl(config),
            connectionInitOptions: { wait: false },
            enableControllerDiscovery: true,
            /** Padrão da lib é REQUEUE — mensagens com erro ficam voltando à fila para sempre. */
            defaultSubscribeErrorBehavior: MessageHandlerErrorBehavior.NACK,
            exchanges: RABBITMQ_EXCHANGES,
            queues: RABBITMQ_QUEUES,
          }),
          inject: [ConfigService],
        }),
      ],
      providers: [
        {
          provide: RabbitMQService,
          useFactory: (amqp: AmqpConnection) => new RabbitMQService(amqp),
          inject: [AmqpConnection],
        },
      ],
      exports: [RabbitMQModuleNest, RabbitMQService],
    };
  }

  static withoutConnection(): DynamicModule {
    return {
      module: RabbitMQModule,
      global: true,
      imports: [ConfigModule],
      providers: [
        {
          provide: RabbitMQService,
          useFactory: () => new RabbitMQService(null),
        },
      ],
      exports: [RabbitMQService],
    };
  }

  static localConnection(): DynamicModule {
    const hasUrl = Boolean(process.env.RABBITMQ_URL?.trim());
    const hasParts = Boolean(
      process.env.RABBITMQ_HOST &&
        process.env.RABBITMQ_PORT &&
        process.env.RABBITMQ_USER &&
        process.env.RABBITMQ_PASSWORD,
    );
    // RABBITMQ_VHOST é opcional: buildRabbitUrl usa "/" quando omitido.
    if (hasUrl || hasParts) {
      return this.forRootAsync();
    }
    return this.withoutConnection();
  }
}