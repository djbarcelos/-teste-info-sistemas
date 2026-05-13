import { ConfigService } from '@nestjs/config';

export function buildRabbitUrl(config: ConfigService): string {
  const url = config.get<string>('RABBITMQ_URL');
  const host = config.get<string>('RABBITMQ_HOST', 'localhost');
  const port = config.get<number>('RABBITMQ_PORT', 5672);
  const user = config.get<string>('RABBITMQ_USER', 'guest');
  const password = config.get<string>('RABBITMQ_PASSWORD', 'guest');
  const vhost = config.get<string>('RABBITMQ_VHOST', '/');
  return url ?? `amqp://${user}:${password}@${host}:${port}/${vhost}`;
}