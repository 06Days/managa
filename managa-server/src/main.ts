import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as path from 'path';
import { AppModule } from './app.module';

// Node 20.12+/22 can load .env without an extra dependency. Missing files are
// fine, and real environment variables always win.
try {
  process.loadEnvFile(path.join(process.cwd(), '.env'));
} catch {
  // No .env file.
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  app.enableCors({ origin: true, credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );
  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle('managa API')
    .setDescription(
      'Install, toggle, rebuild and uninstall compatible client/server app bundles.',
    )
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT ?? 5100);
  await app.listen(port, '0.0.0.0');

  const logger = new Logger('Bootstrap');
  logger.log(`managa server: http://localhost:${port}`);
  logger.log(`API docs: http://localhost:${port}/docs`);
  logger.log(`MCP endpoint: http://localhost:${port}/mcp`);
}

void bootstrap();
