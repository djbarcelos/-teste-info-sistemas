import {
  INestApplication,
  Module,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PrismaModule } from '../src/common/prisma/prisma.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { RabbitMQModule } from '../src/common/rabbitmq/rabbitmq.module';
import { VehiclesModule } from '../src/modules/vehicles/vehicles.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    RabbitMQModule.withoutConnection(),
    PrismaModule,
    VehiclesModule,
  ],
})
class VehiclesHttpE2eAppModule {}

const hasDatabaseUrl =
  typeof process.env.DATABASE_URL === 'string' &&
  process.env.DATABASE_URL.length > 0;

const describeE2e = hasDatabaseUrl ? describe : describe.skip;

describeE2e('Veículos (e2e HTTP)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let createdId: string | undefined;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [VehiclesHttpE2eAppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.enableVersioning({
      type: VersioningType.URI,
      prefix: 'v',
    });
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    if (createdId) {
      await prisma.vehicle.deleteMany({ where: { id: createdId } });
    }
    await app.close();
    await prisma.$disconnect().catch(() => undefined);
  });

  it('fluxo: criar, listar com paginação, obter, atualizar e remover', async () => {
    const n = Date.now();
    const placa = `Z${String(n).slice(-9)}`.slice(0, 10);
    const chassi = `9BWZZZZ377VT${String(n % 100000).padStart(5, '0')}`;
    const renavam = String(n % 10 ** 11).padStart(11, '0');
    const payload = {
      placa,
      chassi,
      renavam,
      modelo: 'Modelo teste e2e',
      marca: 'Marca TI',
      ano: 2024,
    };

    const createRes = await request(app.getHttpServer())
      .post('/v1/vehicles')
      .send(payload)
      .expect(201);

    expect(createRes.body).toMatchObject({
      placa: payload.placa,
      modelo: payload.modelo,
    });
    createdId = createRes.body.id as string;

    const listRes = await request(app.getHttpServer())
      .get('/v1/vehicles')
      .query({ page: 1, limit: 5 })
      .expect(200);

    expect(listRes.body.meta).toMatchObject({
      page: 1,
      limit: 5,
    });
    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(
      listRes.body.data.some((v: { id: string }) => v.id === createdId),
    ).toBe(true);

    const searchRes = await request(app.getHttpServer())
      .get('/v1/vehicles')
      .query({ page: 1, limit: 10, search: 'teste e2e' })
      .expect(200);
    expect(
      searchRes.body.data.some((v: { id: string }) => v.id === createdId),
    ).toBe(true);
    expect(searchRes.body.meta.total).toBeGreaterThanOrEqual(1);

    const oneRes = await request(app.getHttpServer())
      .get(`/v1/vehicles/${createdId}`)
      .expect(200);
    expect(oneRes.body.id).toBe(createdId);

    const patchRes = await request(app.getHttpServer())
      .patch(`/v1/vehicles/${createdId}`)
      .send({ modelo: 'Atualizado' })
      .expect(200);
    expect(patchRes.body.modelo).toBe('Atualizado');

    await request(app.getHttpServer())
      .delete(`/v1/vehicles/${createdId}`)
      .expect(204);

    await request(app.getHttpServer())
      .get(`/v1/vehicles/${createdId}`)
      .expect(404);

    createdId = undefined;
  });
});
