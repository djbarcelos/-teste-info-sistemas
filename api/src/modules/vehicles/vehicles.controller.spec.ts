import { Test, TestingModule } from '@nestjs/testing';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

describe('VehiclesController', () => {
  let controller: VehiclesController;
  let vehiclesService: jest.Mocked<VehiclesService>;

  const id = '0196715c-0b5a-7831-8b3d-849a1972c0a5';
  const vehicle = {
    id,
    placa: 'ABC1D23',
    chassi: '9BWZZZ377VT004251',
    renavam: '12345678901',
    modelo: 'Gol',
    marca: 'VW',
    ano: 2024,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    vehiclesService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as unknown as jest.Mocked<VehiclesService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [{ provide: VehiclesService, useValue: vehiclesService }],
    }).compile();

    controller = module.get(VehiclesController);
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('create deve delegar ao service', async () => {
    const dto: CreateVehicleDto = {
      placa: 'ABC1D23',
      chassi: '9BWZZZ377VT004251',
      renavam: '12345678901',
      modelo: 'Gol',
      marca: 'VW',
      ano: 2024,
    };
    vehiclesService.create.mockResolvedValue(vehicle);

    const result = await controller.create(dto);

    expect(vehiclesService.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(vehicle);
  });

  it('findAll deve delegar ao service com paginação', async () => {
    const paginated = {
      data: [vehicle],
      meta: { page: 2, limit: 5, total: 11, totalPages: 3 },
    };
    vehiclesService.findAll.mockResolvedValue(paginated);

    const result = await controller.findAll({ page: 2, limit: 5 });

    expect(vehiclesService.findAll).toHaveBeenCalledWith({ page: 2, limit: 5 });
    expect(result).toEqual(paginated);
  });

  it('findAll deve repassar filtro de busca ao service', async () => {
    const paginated = {
      data: [vehicle],
      meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
    };
    vehiclesService.findAll.mockResolvedValue(paginated);

    await controller.findAll({ page: 1, limit: 10, search: 'VW' });

    expect(vehiclesService.findAll).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: 'VW',
    });
  });

  it('findOne deve delegar ao service', async () => {
    vehiclesService.findOne.mockResolvedValue(vehicle);

    const result = await controller.findOne(id);

    expect(vehiclesService.findOne).toHaveBeenCalledWith(id);
    expect(result).toEqual(vehicle);
  });

  it('update deve delegar ao service', async () => {
    const patch = { ano: 2025 };
    vehiclesService.update.mockResolvedValue({ ...vehicle, ...patch });

    const result = await controller.update(id, patch);

    expect(vehiclesService.update).toHaveBeenCalledWith(id, patch);
    expect(result.ano).toBe(2025);
  });

  it('remove deve delegar ao service', async () => {
    vehiclesService.remove.mockResolvedValue(vehicle);

    await controller.remove(id);

    expect(vehiclesService.remove).toHaveBeenCalledWith(id);
  });
});
