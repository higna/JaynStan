import { Module } from '@nestjs/common';
import { AppService } from '../app.service.js';
import { DatabaseModule } from '../database/database.module.js';

@Module({
  imports: [DatabaseModule],
  providers: [AppService],
  exports: [AppService],
})
export class CoreModule {}
