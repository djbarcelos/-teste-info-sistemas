import { Injectable, Logger } from '@nestjs/common';
import {
  MessageHandlerErrorBehavior,
  RabbitSubscribe,
} from '@golevelup/nestjs-rabbitmq';
import { RABBITMQ_QUEUE_NAMES } from '../../common/rabbitmq/rabbitmq-queues';
import type { VehicleDomainEventMessage } from '../../modules/vehicles/vehicle-domain-event';

const QUEUE_NAME = RABBITMQ_QUEUE_NAMES.VEHICLE_EVENTS;

@Injectable()
export class VehicleEventsWorker {
  private readonly logger = new Logger(VehicleEventsWorker.name);

  @RabbitSubscribe({
    queue: QUEUE_NAME,
    exchange: '',
    routingKey: QUEUE_NAME,
    createQueueIfNotExists: false,
    queueOptions: {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': `${QUEUE_NAME}.dlx`,
        'x-dead-letter-routing-key': `${QUEUE_NAME}.dlq`,
      },
    },
    allowNonJsonMessages: true,
    errorBehavior: MessageHandlerErrorBehavior.NACK,
  })
  handle(msg: VehicleDomainEventMessage | string): void {
    let payload: VehicleDomainEventMessage;
    try {
      payload = this.parsePayload(msg);
      this.validatePayload(payload);
    } catch (err) {
      this.logger.error(
        `Mensagem irrecuperável — removendo da fila (ACK): ${err instanceof Error ? err.message : String(err)}`,
      );
      return;
    }

    const { eventType, vehicle, occurredAt } = payload;

    this.logger.log(
      `[${String(eventType)}] id=${String(vehicle.id)} placa=${String(vehicle.placa)} @ ${String(occurredAt)}`,
    );

    this.processEvent(payload);
  }

  private processEvent(payload: VehicleDomainEventMessage): void {
    const { eventType, vehicle } = payload;

    switch (eventType) {
      case 'created':
        this.logger.debug(
          `Novo veículo registrado: ${String(vehicle.placa)} (${String(vehicle.marca)} ${String(vehicle.modelo)} ${String(vehicle.ano)})`,
        );
        break;
      case 'updated':
        this.logger.debug(`Veículo atualizado: ${String(vehicle.id)}`);
        break;
      case 'deleted':
        this.logger.debug(
          `Veículo removido: ${String(vehicle.id)} (${String(vehicle.placa)})`,
        );
        break;
      default:
        this.logger.warn(
          `Tipo de evento desconhecido recebido na fila ${QUEUE_NAME}`,
        );
    }
  }

  private validatePayload(payload: VehicleDomainEventMessage): void {
    const { eventType, vehicle, occurredAt } = payload;
    if (!eventType || !occurredAt) {
      throw new Error(
        `campos obrigatórios ausentes (eventType="${String(eventType)}", occurredAt="${String(occurredAt)}")`,
      );
    }
    if (!vehicle?.id) {
      throw new Error('vehicle.id ausente');
    }
  }

  private parsePayload(
    msg: VehicleDomainEventMessage | string,
  ): VehicleDomainEventMessage {
    if (typeof msg !== 'string') {
      return msg;
    }
    try {
      return JSON.parse(msg) as VehicleDomainEventMessage;
    } catch {
      this.logger.error(
        `JSON inválido na fila ${QUEUE_NAME}: ${msg.slice(0, 200)}`,
      );
      throw new Error('JSON inválido');
    }
  }
}
