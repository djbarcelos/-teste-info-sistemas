import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Corpo típico de `400` retornado pelo `ValidationPipe` global (campos inválidos ou proibidos). */
export class ApiValidationErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({
    description: 'Mensagem única ou lista de mensagens por campo',
    example: ['placa must be longer than or equal to 7 characters'],
    type: [String],
  })
  message!: string | string[];

  @ApiProperty({ example: 'Bad Request' })
  error!: string;
}

/** `400` genérico (ex.: PATCH sem campos — `BadRequestException`). */
export class ApiBadRequestMessageResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: 'Nenhum campo para atualizar.' })
  message!: string;

  @ApiProperty({ example: 'Bad Request' })
  error!: string;
}

/** `404` do Nest (`NotFoundException`) ao buscar veículo por id inexistente. */
export class ApiNotFoundResponseDto {
  @ApiProperty({ example: 404 })
  statusCode!: number;

  @ApiProperty({ example: 'Not Found' })
  error!: string;

  @ApiProperty({
    example: 'Veículo com id 0196715c-0b5a-7831-8b3d-849a1972c0a5 não encontrado.',
  })
  message!: string;
}

/**
 * Erros mapeados pelo `PrismaClientExceptionFilter` (conflito único, não encontrado em update/delete, etc.).
 */
export class ApiPrismaClientErrorResponseDto {
  @ApiProperty({
    example: 409,
    description:
      'HTTP status retornado pelo filtro (ex.: **404** para P2025, **409** para P2002, **400** para P2003, etc.)',
  })
  statusCode!: number;

  @ApiProperty({
    example: 'UNIQUE_CONSTRAINT_VIOLATION',
    description:
      'Código interno: `UNIQUE_CONSTRAINT_VIOLATION` (P2002), `RESOURCE_NOT_FOUND` (P2025), entre outros',
  })
  error!: string;

  @ApiProperty({
    example: 'Registro duplicado. Já existe um item com esse valor.',
  })
  message!: string;

  @ApiPropertyOptional({
    description: 'Metadados do Prisma (ex.: `target` dos índices únicos em P2002)',
    example: { target: ['placa'] },
  })
  details?: Record<string, unknown>;
}
