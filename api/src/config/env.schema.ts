import { plainToInstance } from 'class-transformer';
import { IsNumber, IsOptional, IsEnum, Min, Max, IsString } from 'class-validator';
import { validateSync, ValidationError } from 'class-validator';

export enum NodeEnv {
  development = 'development',
  production = 'production',
  test = 'test',
}

export class EnvSchema {
  @IsOptional()
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.development;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsOptional()
  @IsString()
  DATABASE_URL?: string;

  @IsOptional()
  @IsString()
  RABBITMQ_URL?: string;

  @IsOptional()
  @IsString()
  RABBITMQ_HOST?: string;

  @IsOptional()
  @IsString()
  RABBITMQ_PORT?: string;
  
  @IsOptional()
  @IsString()
  RABBITMQ_USER?: string;

  @IsOptional()
  @IsString()
  RABBITMQ_PASSWORD?: string;

  @IsOptional()
  @IsString()
  RABBITMQ_VHOST?: string;

  @IsOptional()
  @IsString()
  CRON_TIME_ZONE?: string;
}

export function validate(config: Record<string, unknown>): EnvSchema {
  const validated = plainToInstance(EnvSchema, config, {
    enableImplicitConversion: true,
  });

  const errors: ValidationError[] = validateSync(validated, {
    whitelist: true,
    forbidNonWhitelisted: false,
  });

  if (errors.length > 0) {
    const messages: string[] = errors.flatMap((e: ValidationError) =>
      Object.values(e.constraints ?? {}),
    );
    throw new Error(
      `Configuração de ambiente inválida:\n${messages.join('\n')}`,
    );
  }

  return validated;
}
