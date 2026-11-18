import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';
import { configureApp } from './app.setup.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableShutdownHooks();
  configureApp(app);

  const port = Number(process.env.PORT || process.env.SERVER_PORT || 2500);
  const frontendUrl = process.env.FRONTEND_URL || `http://localhost:${process.env.CLIENT_PORT || 2000}`;
  const backendUrl = process.env.BACKEND_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;

  await app.listen(port, '0.0.0.0');

  console.log('--------------------------------------------------');
  console.log('JaynStan API server started successfully');
  console.log(`Allowed frontend origin: ${frontendUrl}`);
  console.log(`Server running on port: ${port}`);
  console.log(`Welcome page: ${backendUrl}/`);
  console.log(`API base: ${backendUrl}/api`);
  console.log(`Swagger docs: ${backendUrl}/api/docs`);
  console.log(`Health dashboard: ${backendUrl}/health`);
  console.log('--------------------------------------------------');
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to start the API server', error);
  process.exit(1);
});
