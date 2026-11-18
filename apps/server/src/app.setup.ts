import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

export function configureApp(app: NestExpressApplication): void {
  const config = app.get(ConfigService);
  const allowedOrigins = [
    config.get<string>('FRONTEND_URL', `http://localhost:${config.get<string>('CLIENT_PORT', '2000')}`),
    config.get<string>('PUBLIC_URL', ''),
  ].map((origin) => origin.replace(/\/$/, '')).filter(Boolean);

  app.use(helmet({ contentSecurityPolicy: false }));
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) callback(null, true);
      else callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: true,
  });
  app.setGlobalPrefix('api', {
    exclude: [
      { path: '/', method: RequestMethod.GET },
      { path: 'api', method: RequestMethod.GET },
      { path: 'health', method: RequestMethod.GET },
      { path: 'health/ready', method: RequestMethod.GET },
      { path: 'health/live', method: RequestMethod.GET },
      { path: 'health/data', method: RequestMethod.GET },
      { path: 'health/keep-alive/toggle', method: RequestMethod.POST },
      { path: 'health/ping', method: RequestMethod.POST },
    ],
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  if (config.get<string>('NODE_ENV') === 'production' && config.get<string>('SWAGGER_ENABLED') !== 'true') {
    return;
  }

  const swaggerConfig = new DocumentBuilder()
    .setTitle('JaynStan API')
    .setDescription('API for creative profiles, services and portfolio work.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });
}
