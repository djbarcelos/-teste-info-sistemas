import { validate } from './env.schema';

export default () => {
  const raw = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : undefined,
    DATABASE_URL: process.env.DATABASE_URL,
    RABBITMQ_URL: process.env.RABBITMQ_URL,
    RABBITMQ_HOST: process.env.RABBITMQ_HOST,
    RABBITMQ_PORT: process.env.RABBITMQ_PORT,
    RABBITMQ_USER: process.env.RABBITMQ_USER,
    RABBITMQ_PASSWORD: process.env.RABBITMQ_PASSWORD,
    RABBITMQ_VHOST: process.env.RABBITMQ_VHOST,
    CRON_TIME_ZONE: process.env.CRON_TIME_ZONE,
    // Inclua aqui todas as chaves que existem em EnvSchema
  };

  return validate(raw);
};
