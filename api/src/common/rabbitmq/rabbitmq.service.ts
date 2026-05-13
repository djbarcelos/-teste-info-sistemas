import { Injectable, Logger, Optional } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

interface PublishOptions {
  priority?: number;    // 0–10 (só para filas com x-max-priority)
  persistent?: boolean;
}

@Injectable()
export class RabbitMQService {
  private static warnedNoConnection = false;
  private readonly logger = new Logger(RabbitMQService.name);

  constructor(@Optional() private readonly amqp: AmqpConnection | null) {}

  private warnOnceNoConnection(context: string): void {
    if (RabbitMQService.warnedNoConnection || this.amqp) {
      return;
    }
    RabbitMQService.warnedNoConnection = true;
    this.logger.warn(
      `${context}: RabbitMQ desabilitado (sem RABBITMQ_URL nem HOST/PORT/USER/PASSWORD). Mensagens não serão publicadas.`,
    );
  }

  async publish(exchange: string, routingKey: string, message: object): Promise<void> {
    if (!this.amqp) {
      this.warnOnceNoConnection('publish');
      return;
    }
    await this.amqp.publish(exchange, routingKey, message);
  }

  async publishToQueue(queue: string, message: object, options: PublishOptions = {}): Promise<void> {
    if (!this.amqp) {
      this.warnOnceNoConnection(`publishToQueue(${queue})`);
      return;
    }
    const { priority, persistent = true } = options;
    await this.amqp.publish('', queue, message, {
      persistent,
      ...(priority !== undefined && { priority }),
    });
  }
}