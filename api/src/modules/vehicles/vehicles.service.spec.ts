import { BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RabbitMQService } from '../../common/rabbitmq/rabbitmq.service';
import { RABBITMQ_QUEUE_NAMES } from '../../common/rabbitmq/rabbitmq-queues';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { VehiclesService } from './vehicles.service';

type VehicleDelegateMock = {
  create: jest.Mock;
  findMany: jest.Mock;
  findUnique: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  count: jest.Mock;
};

describe('VehiclesService', () => {
  let service: VehiclesService;
  let prisma: { vehicle: VehicleDelegateMock };
  let rabbit: { publishToQueue: jest.Mock };

  const sampleVehicle = {
    id: '0196715c-0b5a-7831-8b3d-849a1972c0a5',
    placa: 'ABC1D23',
    chassi: '9BWZZZ377VT004251',
    renavam: '12345678901',
    modelo: 'Gol',
    marca: 'VW',
    ano: 2024,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createDto: CreateVehicleDto = {
    placa: 'ABC1D23',
    chassi: '9BWZZZ377VT004251',
    renavam: '12345678901',
    modelo: 'Gol',
    marca: 'VW',
    ano: 2024,
  };

  beforeEach(async () => {
    prisma = {
      vehicle: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    };
    rabbit = { publishToQueue: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: PrismaService, useValue: prisma },
        { provide: RabbitMQService, useValue: rabbit },
      ],
    }).compile();

    service = module.get(VehiclesService);
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('deve persistir e retornar o veículo criado', async () => {
      prisma.vehicle.create.mockResolvedValue(sampleVehicle);

      const result = await service.create(createDto);

      expect(prisma.vehicle.create).toHaveBeenCalledWith({ data: createDto });
      // Aguarda o microtask do fire-and-forget antes de checar a fila
      await Promise.resolve();
      expect(rabbit.publishToQueue).toHaveBeenCalledWith(
        RABBITMQ_QUEUE_NAMES.VEHICLE_EVENTS,
        expect.objectContaining({
          eventType: 'created',
          vehicle: expect.objectContaining({
            id: sampleVehicle.id,
            placa: sampleVehicle.placa,
          }),
        }),
      );
      expect(result).toEqual(sampleVehicle);
    });

    it('não deve lançar erro se a publicação na fila falhar', async () => {
      const errorLog = jest.spyOn(Logger.prototype, 'error').mockImplementation();
      prisma.vehicle.create.mockResolvedValue(sampleVehicle);
      rabbit.publishToQueue.mockRejectedValue(new Error('Broker indisponível'));

      await expect(service.create(createDto)).resolves.toEqual(sampleVehicle);
      await Promise.resolve();
      expect(errorLog).toHaveBeenCalled();
      errorLog.mockRestore();
    });
  });

  describe('findAll', () => {
    it('deve retornar página com meta e ordenação por createdAt desc', async () => {
      prisma.vehicle.findMany.mockResolvedValue([sampleVehicle]);
      prisma.vehicle.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(prisma.vehicle.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      expect(prisma.vehicle.count).toHaveBeenCalledWith({ where: {} });
      expect(result).toEqual({
        data: [sampleVehicle],
        meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });
    });

    it('deve filtrar por busca em placa, modelo ou marca', async () => {
      const searchWhere = {
        OR: [
          { placa: { contains: 'Gol', mode: 'insensitive' } },
          { modelo: { contains: 'Gol', mode: 'insensitive' } },
          { marca: { contains: 'Gol', mode: 'insensitive' } },
        ],
      };
      prisma.vehicle.findMany.mockResolvedValue([sampleVehicle]);
      prisma.vehicle.count.mockResolvedValue(1);

      await service.findAll({ page: 1, limit: 10, search: 'Gol' });

      expect(prisma.vehicle.findMany).toHaveBeenCalledWith({
        where: searchWhere,
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      expect(prisma.vehicle.count).toHaveBeenCalledWith({
        where: searchWhere,
      });
    });

    it('deve aplicar skip na segunda página', async () => {
      prisma.vehicle.findMany.mockResolvedValue([]);
      prisma.vehicle.count.mockResolvedValue(30);

      await service.findAll({ page: 2, limit: 10 });

      expect(prisma.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 10 }),
      );
    });

    it('deve limitar take a no máximo 100', async () => {
      prisma.vehicle.findMany.mockResolvedValue([]);
      prisma.vehicle.count.mockResolvedValue(0);

      await service.findAll({ page: 1, limit: 999 });

      expect(prisma.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100, skip: 0 }),
      );
    });
  });

  describe('findOne', () => {
    it('deve retornar o veículo quando existir', async () => {
      prisma.vehicle.findUnique.mockResolvedValue(sampleVehicle);

      const result = await service.findOne(sampleVehicle.id);

      expect(prisma.vehicle.findUnique).toHaveBeenCalledWith({
        where: { id: sampleVehicle.id },
      });
      expect(result).toEqual(sampleVehicle);
    });

    it('deve lançar NotFoundException quando não existir', async () => {
      prisma.vehicle.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('0196715c-0b5a-7831-8b3d-849a1972c0a6'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('deve atualizar quando houver campos no DTO', async () => {
      const patch = { modelo: 'Polo' };
      prisma.vehicle.update.mockResolvedValue({ ...sampleVehicle, ...patch });

      const result = await service.update(sampleVehicle.id, patch);

      expect(prisma.vehicle.update).toHaveBeenCalledWith({
        where: { id: sampleVehicle.id },
        data: patch,
      });
      await Promise.resolve();
      expect(rabbit.publishToQueue).toHaveBeenCalledWith(
        RABBITMQ_QUEUE_NAMES.VEHICLE_EVENTS,
        expect.objectContaining({
          eventType: 'updated',
        }),
      );
      expect(result.modelo).toBe('Polo');
    });

    it('deve lançar BadRequestException quando o corpo estiver vazio', async () => {
      await expect(service.update(sampleVehicle.id, {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.vehicle.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deve chamar delete com o id informado', async () => {
      prisma.vehicle.delete.mockResolvedValue(sampleVehicle);

      const result = await service.remove(sampleVehicle.id);

      expect(prisma.vehicle.delete).toHaveBeenCalledWith({
        where: { id: sampleVehicle.id },
      });
      await Promise.resolve();
      expect(rabbit.publishToQueue).toHaveBeenCalledWith(
        RABBITMQ_QUEUE_NAMES.VEHICLE_EVENTS,
        expect.objectContaining({
          eventType: 'deleted',
          vehicle: expect.objectContaining({
            id: sampleVehicle.id,
            placa: sampleVehicle.placa,
          }),
        }),
      );
      expect(result).toEqual(sampleVehicle);
    });
  });
});
