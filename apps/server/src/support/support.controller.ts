import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth/provider-categories.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { CreateSupportRequestDto } from './dto/create-support-request.dto.js';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard.js';
import { SupportService } from './support.service.js';

@ApiTags('Support')
@Controller('support')
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Post('contact')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Send a support request; create an account linked ticket when authenticated' })
  contact(@Body() dto: CreateSupportRequestDto, @Req() request: Request & { user?: AuthenticatedUser }) {
    return this.support.submit(dto, request.user);
  }

  @Get('admin/tickets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List support tickets and their replies' })
  listTickets() { return this.support.listTickets(); }

  @Post('admin/tickets/:id/replies')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reply to a support ticket and email the requester' })
  reply(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() sender: AuthenticatedUser, @Body('message') message: unknown) {
    if (typeof message !== 'string' || message.trim().length < 2 || message.length > 5000) {
      throw new BadRequestException('A reply between 2 and 5000 characters is required.');
    }
    return this.support.replyToTicket(id, sender, message);
  }

  @Patch('admin/tickets/:id/settle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a ticket as settled and email the requester' })
  settle(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() admin: AuthenticatedUser) {
    return this.support.settleTicket(id, admin);
  }
}
