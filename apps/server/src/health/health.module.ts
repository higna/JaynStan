import { Module } from '@nestjs/common';
import { CoreModule } from '../core/core.module.js';
import { HealthController } from './health.controller.js';
import { HealthPageService } from './health-page.service.js';
import { KeepAliveService } from './keep-alive.service.js';

@Module({
  imports: [CoreModule],
  controllers: [HealthController],
  providers: [HealthPageService, KeepAliveService],
})
export class HealthModule {}
