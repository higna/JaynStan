import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { AppService } from './app.service.js';

@ApiExcludeController()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  getRoot(): string {
    return this.appService.getWelcomeHtml();
  }

  @Get('api')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getApiLanding(): string {
    return this.appService.getWelcomeHtml();
  }
}
