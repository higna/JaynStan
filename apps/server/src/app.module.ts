import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AppController } from './app.controller.js';
import { CommonModule } from './common/common.module.js';
import { CoreModule } from './core/core.module.js';
import { HealthModule } from './health/health.module.js';
import { AuthModule } from './auth/auth.module.js';
import { SupportModule } from './support/support.module.js';
import { FeaturedWorksModule } from './featured-works/featured-works.module.js';
import { SiteSettingsModule } from './site-settings/site-settings.module.js';

const rootEnvPath = resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: rootEnvPath }),
    ScheduleModule.forRoot(),
    CommonModule,
    CoreModule,
    AuthModule,
    SupportModule,
    FeaturedWorksModule,
    SiteSettingsModule,
    HealthModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
