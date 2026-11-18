import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { FeaturedWorksController } from './featured-works.controller.js';
import { FeaturedWorksService } from './featured-works.service.js';

@Module({ imports: [AuthModule], controllers: [FeaturedWorksController], providers: [FeaturedWorksService] })
export class FeaturedWorksModule {}
