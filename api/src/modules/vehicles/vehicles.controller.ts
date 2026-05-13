import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  ApiBadRequestMessageResponseDto,
  ApiNotFoundResponseDto,
  ApiPrismaClientErrorResponseDto,
  ApiValidationErrorResponseDto,
} from '../../common/swagger/error-responses.dto';
import { VEHICLES_API_VERSION } from '../../common/constants/api-version';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import {
  PaginatedVehiclesResponseDto,
  VehicleResponseDto,
} from './dto/paginated-vehicles-response.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesService } from './vehicles.service';

@ApiTags('vehicles')
@ApiExtraModels(
  ApiValidationErrorResponseDto,
  ApiBadRequestMessageResponseDto,
  ApiNotFoundResponseDto,
  ApiPrismaClientErrorResponseDto,
)
@Controller({ path: 'vehicles', version: VEHICLES_API_VERSION })
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Criar veículo',
  })
  @ApiBody({ type: CreateVehicleDto })
  @ApiCreatedResponse({
    type: VehicleResponseDto,
    description: 'Veículo criado com sucesso.',
  })
  @ApiBadRequestResponse({
    description: 'Corpo inválido (validação) ou propriedades não permitidas.',
    type: ApiValidationErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Violação de unicidade (ex.: placa, chassi ou renavam já existentes).',
    type: ApiPrismaClientErrorResponseDto,
  })
  create(@Body() createVehicleDto: CreateVehicleDto) {
    return this.vehiclesService.create(createVehicleDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar veículos',
  })
  @ApiOkResponse({
    type: PaginatedVehiclesResponseDto,
    description: 'Lista paginada.',
  })
  @ApiBadRequestResponse({
    description: 'Query inválida.',
    type: ApiValidationErrorResponseDto,
  })
  findAll(@Query() pagination: PaginationQueryDto) {
    return this.vehiclesService.findAll(pagination);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obter veículo por id',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do veículo',
    format: 'uuid',
    example: '0196715c-0b5a-7831-8b3d-849a1972c0a5',
  })
  @ApiOkResponse({
    type: VehicleResponseDto,
    description: 'Veículo encontrado.',
  })
  @ApiBadRequestResponse({
    description: 'ID inválido.',
    type: ApiBadRequestMessageResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Veículo inexistente.',
    type: ApiNotFoundResponseDto,
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.vehiclesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Atualizar veículo',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do veículo',
    format: 'uuid',
    example: '0196715c-0b5a-7831-8b3d-849a1972c0a5',
  })
  @ApiBody({ type: UpdateVehicleDto })
  @ApiOkResponse({
    type: VehicleResponseDto,
    description: 'Veículo atualizado.',
  })
  @ApiBadRequestResponse({
    description:
      'Corpo inválido (validação) ou propriedades não permitidas.',
    type: ApiValidationErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description:
      'Veículo inexistente.',
    type: ApiPrismaClientErrorResponseDto,
  })
  @ApiConflictResponse({
    description: 'Veículo já existe.',
    type: ApiPrismaClientErrorResponseDto,
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(id, updateVehicleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover veículo',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID do veículo',
    format: 'uuid',
    example: '0196715c-0b5a-7831-8b3d-849a1972c0a5',
  })
  @ApiNoContentResponse({ description: 'Veículo removido.' })
  @ApiBadRequestResponse({
    description: 'ID inválido.',
    type: ApiBadRequestMessageResponseDto,
  })
  @ApiNotFoundResponse({
    description:
      'Veículo inexistente.',
    type: ApiPrismaClientErrorResponseDto,
  })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.vehiclesService.remove(id);
  }
}
