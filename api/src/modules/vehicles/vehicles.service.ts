import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Vehicle } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RabbitMQService } from '../../common/rabbitmq/rabbitmq.service';
import { RABBITMQ_QUEUE_NAMES } from '../../common/rabbitmq/rabbitmq-queues';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import type {
  VehicleDomainEventType,
  VehicleEventData,
} from './vehicle-domain-event';

export type PaginatedVehicles = {
  data: Vehicle[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

@Injectable()
export class VehiclesService {
  private readonly logger = new Logger(VehiclesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbit: RabbitMQService,
  ) {}

  private vehicleSearchWhere(search?: string): Prisma.VehicleWhereInput {
    const term = typeof search === 'string' ? search.trim() : '';
    if (!term) {
      return {};
    }
    return {
      OR: [
        { placa: { contains: term, mode: 'insensitive' } },
        { modelo: { contains: term, mode: 'insensitive' } },
        { marca: { contains: term, mode: 'insensitive' } },
      ],
    };
  }

  async create(dto: CreateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.prisma.vehicle.create({ data: dto });
    this.publishVehicleEvent('created', vehicle);
    return vehicle;
  }

  async findAll(query: PaginationQueryDto = {}): Promise<PaginatedVehicles> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 100);
    const skip = (page - 1) * limit;
    const where = this.vehicleSearchWhere(query.search);

    const [data, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data,
      meta: { page, limit, total, totalPages },
    };
  }

  async findOne(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException(`Veículo com id ${id} não encontrado.`);
    }
    return vehicle;
  }

  async update(id: string, dto: UpdateVehicleDto) {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Nenhum campo para atualizar.');
    }
    const vehicle = await this.prisma.vehicle.update({
      where: { id },
      data: dto,
    });
    this.publishVehicleEvent('updated', vehicle);
    return vehicle;
  }

  async remove(id: string): Promise<Vehicle> {
    const vehicle = await this.prisma.vehicle.delete({ where: { id } });
    this.publishVehicleEvent('deleted', vehicle);
    return vehicle;
  }

  private publishVehicleEvent(
    eventType: VehicleDomainEventType,
    vehicle: Vehicle,
  ): void {
    this.rabbit
      .publishToQueue(RABBITMQ_QUEUE_NAMES.VEHICLE_EVENTS, {
        eventType,
        occurredAt: new Date().toISOString(),
        vehicle: this.vehicleToEventPayload(vehicle),
      })
      .catch((err: unknown) => {
        this.logger.error(
          `Falha ao publicar evento "${eventType}" para veículo ${vehicle.id}: ${err instanceof Error ? err.message : String(err)}`,
        );
      });
  }

  private vehicleToEventPayload(vehicle: Vehicle): VehicleEventData {
    return {
      id: vehicle.id,
      placa: vehicle.placa,
      chassi: vehicle.chassi,
      renavam: vehicle.renavam,
      modelo: vehicle.modelo,
      marca: vehicle.marca,
      ano: vehicle.ano,
      createdAt: vehicle.createdAt.toISOString(),
      updatedAt: vehicle.updatedAt.toISOString(),
    };
  }
}
