import type {
  RabbitMQQueueConfig,
  RabbitMQExchangeConfig,
} from '@golevelup/nestjs-rabbitmq';

/** Opções de criação de uma fila. */
interface QueueOptions {
  /**
   * FIFO (true): fila clássica, mensagens processadas em ordem de entrada.
   * Não-FIFO (false): habilita prioridades (x-max-priority: 10). O publisher
   * pode definir a prioridade da mensagem ao publicar.
   */
  fifo?: boolean;
}

const DLX_TYPE = 'direct' as const;

/**
 * Cria uma fila com DLX/DLQ próprios e suporte a FIFO ou não-FIFO.
 * Publica-se diretamente na fila via default exchange (sem binding em app.exchange).
 */
function queueWithDlq(
  name: string,
  options: QueueOptions = { fifo: true },
): { dlxExchange: RabbitMQExchangeConfig; queues: RabbitMQQueueConfig[] } {
  const { fifo = true } = options;
  const dlxName = `${name}.dlx`;
  const dlqName = `${name}.dlq`;

  const mainQueueArgs: Record<string, unknown> = {
    'x-dead-letter-exchange': dlxName,
    'x-dead-letter-routing-key': dlqName,
  };

  if (!fifo) {
    mainQueueArgs['x-max-priority'] = 10; // habilita prioridade 0–10
  }

  return {
    dlxExchange: { name: dlxName, type: DLX_TYPE },
    queues: [
      // Fila morta
      {
        name: dlqName,
        options: { durable: true },
        // Faz o binding da queue DLQ na exchange DLX
        exchange: dlxName,
        routingKey: dlqName,
      },
      // Fila principal
      {
        name,
        options: {
          durable: true,
          arguments: mainQueueArgs,
        },
      },
    ],
  };
}

/** Nomes das filas principais */
export const RABBITMQ_QUEUE_NAMES = {
  VEHICLE_EVENTS: 'vehicle.events',
} as const;

const vehicleEvents = queueWithDlq(RABBITMQ_QUEUE_NAMES.VEHICLE_EVENTS, {
  fifo: true,
});

export const RABBITMQ_EXCHANGES: RabbitMQExchangeConfig[] = [
  vehicleEvents.dlxExchange,
];

export const RABBITMQ_QUEUES: RabbitMQQueueConfig[] = [
  ...vehicleEvents.queues,
];