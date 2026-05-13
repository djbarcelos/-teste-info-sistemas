import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 1, description: 'Página atual (base 1)' })
  page!: number;

  @ApiProperty({ example: 10, description: 'Tamanho da página utilizada na resposta' })
  limit!: number;

  @ApiProperty({
    example: 42,
    description: 'Total de registros que correspondem aos filtros (ex.: `search`)',
  })
  total!: number;

  @ApiProperty({
    example: 5,
    description: 'Total de páginas para o `limit` atual (`0` se não houver registros)',
  })
  totalPages!: number;
}

export class VehicleResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '0196715c-0b5a-7831-8b3d-849a1972c0a5',
    description: 'Identificador UUID (v7) do veículo',
  })
  id!: string;

  @ApiProperty({ example: 'ABC1D23', description: 'Placa (única)' })
  placa!: string;

  @ApiProperty({ example: '9BWZZZ377VT004251', description: 'Chassi / VIN (17 caracteres, único)' })
  chassi!: string;

  @ApiProperty({ example: '12345678901', description: 'RENAVAM (único)' })
  renavam!: string;

  @ApiProperty({ example: 'Gol 1.0' })
  modelo!: string;

  @ApiProperty({ example: 'VW' })
  marca!: string;

  @ApiProperty({ example: 2024, minimum: 1900 })
  ano!: number;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    example: '2025-05-12T12:00:00.000Z',
    description: 'Data de criação (UTC)',
  })
  createdAt!: Date;

  @ApiProperty({
    type: 'string',
    format: 'date-time',
    example: '2025-05-12T12:30:00.000Z',
    description: 'Última atualização (UTC)',
  })
  updatedAt!: Date;
}

export class PaginatedVehiclesResponseDto {
  @ApiProperty({
    type: [VehicleResponseDto],
    description: 'Itens da página atual',
  })
  data!: VehicleResponseDto[];

  @ApiProperty({
    type: PaginationMetaDto,
    description: 'Metadados de paginação e contagem',
  })
  meta!: PaginationMetaDto;
}
