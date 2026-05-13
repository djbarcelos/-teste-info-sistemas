import 'dotenv/config';
import "./instrument";
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { PrismaUnknownExceptionFilter } from './common/filters/prisma-client-exception.filter';
import { LogHttpInterceptor } from './interceptors/log.interceptor';

const logger = new Logger('Main');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
  });
  app.enableCors();
  app.use(bodyParser.json({ limit: '5mb' }));
  app.use(bodyParser.urlencoded({ limit: '20mb', extended: true }));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );
  app.useGlobalInterceptors(new LogHttpInterceptor());
  app.useGlobalFilters(new PrismaUnknownExceptionFilter());

  if (process.env.NODE_ENV !== 'production') {
    const port = Number(process.env.PORT);
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Teste Info Sistemas — API')
      .setDescription(
        [
          'API para gerenciamento de veículos.',
        ].join('\n'),
      )
      .setVersion('1.0.0')
      .addServer(`http://localhost:${port}`, 'Ambiente local')
      .addTag('vehicles', 'CRUD, paginação e busca de veículos')
      .addTag('ping', 'Disponibilidade da API')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig, {
      operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
    });

    SwaggerModule.setup('docs', app, document, {
      customSiteTitle: 'API — documentação',
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
        filter: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
        displayRequestDuration: true,
      },
    });

    logger.log(`Swagger UI: http://localhost:${port}/docs`);
    logger.log(`OpenAPI JSON: http://localhost:${port}/docs-json`);
  }

  await app.listen(Number(process.env.PORT), () =>
    logger.log(
      `API running on port ${process.env.PORT} | env: ${process.env.NODE_ENV} `,
    ),
  );
}
bootstrap();

