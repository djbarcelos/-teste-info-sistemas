import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const MAX_ANO = new Date().getFullYear() + 1;

export class CreateVehicleDto {
  @ApiProperty({
    example: 'ABC1D23',
    minLength: 7,
    maxLength: 10,
    description: 'Placa do veículo (Mercosul ou formato legado). Valor único no sistema.',
  })
  @IsString()
  @MinLength(7)
  @MaxLength(10)
  placa!: string;

  @ApiProperty({
    example: '9BWZZZ377VT004251',
    minLength: 17,
    maxLength: 17,
    description: 'Número de identificação do veículo (VIN / chassi), exatamente 17 caracteres. Único.',
  })
  @IsString()
  @MinLength(17)
  @MaxLength(17)
  chassi!: string;

  @ApiProperty({
    example: '12345678901',
    maxLength: 20,
    description: 'Registro nacional do veículo. Único.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  renavam!: string;

  @ApiProperty({
    example: 'Gol 1.0',
    description: 'Denominação do modelo.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  modelo!: string;

  @ApiProperty({
    example: 'VW',
    description: 'Fabricante / marca.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  marca!: string;

  @ApiProperty({
    example: 2024,
    minimum: 1900,
    maximum: MAX_ANO,
    description: `Ano do modelo (fabricação). Máximo permitido: ano corrente + 1 (${MAX_ANO}).`,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(MAX_ANO)
  ano!: number;
}
