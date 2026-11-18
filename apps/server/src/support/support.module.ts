import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { SupportController } from './support.controller.js';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard.js';
import { SupportService } from './support.service.js';

@Module({
  imports: [AuthModule],
  controllers: [SupportController],
  providers: [SupportService, OptionalJwtAuthGuard],
})
export class SupportModule {}
