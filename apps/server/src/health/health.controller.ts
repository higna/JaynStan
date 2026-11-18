import { Controller, Get, Header, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from '../app.service.js';
import { HealthPageService } from './health-page.service.js';
import { KeepAliveService } from './keep-alive.service.js';

@Controller('health')
export class HealthController {
  constructor(
    private readonly appService: AppService,
    private readonly page: HealthPageService,
    private readonly keepAlive: KeepAliveService,
  ) {}

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  getDashboard(): string {
    return this.page.getHtml();
  }

  @Get('live')
  getLiveness() {
    return { status: 'ok', service: 'jaynstan-server' };
  }

  @Get('ready')
  async getReadiness(@Res() response: Response) {
    const checks = await this.appService.getDependencyStatus();
    const healthy = Object.values(checks).every((status) => status === 'connected');
    return response.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'error', checks });
  }

  @Get('data')
  async getData() {
    const checks = await this.appService.getDependencyStatus();
    const healthy = Object.values(checks).every((status) => status === 'connected');
    return {
      status: healthy ? 'ok' : 'error',
      service: 'jaynstan-server',
      version: '1.0.0',
      uptime: process.uptime(),
      checks,
      keepAlive: this.keepAlive.getState(),
    };
  }

  @Post('keep-alive/toggle')
  toggleKeepAlive() {
    return this.keepAlive.toggle();
  }

  @Post('ping')
  ping() {
    return this.keepAlive.manualPing();
  }
}
