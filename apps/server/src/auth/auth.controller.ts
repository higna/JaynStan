import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser, type AuthenticatedRequest } from './decorators/current-user.decorator.js';
import { Roles } from './decorators/roles.decorator.js';
import { LoginDto } from './dto/login.dto.js';
import { ProviderApplicationDto } from './dto/provider-application.dto.js';
import { ReviewApplicationDto } from './dto/review-application.dto.js';
import { CreateAccountDto } from './dto/create-account.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { AuthService } from './auth.service.js';
import type { AuthenticatedUser, UserRole } from './provider-categories.js';

@ApiTags('Authentication and provider applications')
@Controller()
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('admin/accounts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an invited account and email a secure password setup link' })
  createManagedAccount(@Body() dto: CreateAccountDto, @CurrentUser() creator: AuthenticatedUser) {
    return this.auth.createManagedAccount(dto, creator);
  }

  @Get('admin/users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List platform accounts for user management' })
  listUsers(@Query('search') search?: string) { return this.auth.listUsers(search); }

  @Patch('admin/users/:id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change or revoke a platform account role' })
  updateUserRole(@Param('id', ParseUUIDPipe) id: string, @Body('role') role: string, @CurrentUser() actor: AuthenticatedUser) {
    if (!['user', 'admin', 'superadmin'].includes(role)) throw new BadRequestException('Role must be user, admin, or superadmin.');
    return this.auth.updateUserRole(id, role as UserRole, actor);
  }

  @Delete('admin/users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a platform account (superadmin only)' })
  deleteUser(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: AuthenticatedUser) {
    return this.auth.deleteManagedAccount(id, actor);
  }

  @Post('auth/verify-email')
  @HttpCode(200)
  @ApiOperation({ summary: 'Verify an email address using the emailed one-time token' })
  verifyEmail(@Body('token') token: string) {
    if (typeof token !== 'string') throw new BadRequestException('A verification token is required.');
    return this.auth.verifyEmail(token);
  }

  @Post('auth/resend-verification')
  @HttpCode(200)
  @ApiOperation({ summary: 'Resend an email verification link' })
  resendVerification(@Body('email') email: string) {
    if (typeof email !== 'string') throw new BadRequestException('A valid email is required.');
    return this.auth.resendVerification(email);
  }

  @Post('auth/forgot-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Request a password reset email' })
  forgotPassword(@Body('email') email: string) {
    if (typeof email !== 'string') throw new BadRequestException('A valid email is required.');
    return this.auth.requestPasswordReset(email);
  }

  @Post('auth/reset-password')
  @HttpCode(200)
  @ApiOperation({ summary: 'Set a new password using a one-time reset token' })
  resetPassword(@Body('token') token: string, @Body('password') password: string) {
    if (typeof token !== 'string' || typeof password !== 'string' || password.length < 8) {
      throw new BadRequestException('A valid token and password of at least 8 characters are required.');
    }
    return this.auth.resetPassword(token, password);
  }

  @Post('auth/login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Sign in with email and password' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Get('auth/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Return the current authenticated account' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @Get('auth/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Return the signed-in profile and selected disciplines' })
  getProfile(@CurrentUser() user: AuthenticatedUser) { return this.auth.getProfile(user.id); }

  @Patch('auth/profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update profile name, disciplines, and optionally password' })
  updateProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(user.id, dto);
  }

  @Get('auth/google')
  @ApiOperation({ summary: 'Start Google OAuth sign-in' })
  startGoogleSignIn(@Res() response: Response) {
    const state = this.auth.createGoogleState();
    const secure = this.config.get<string>('NODE_ENV') === 'production';
    response.cookie('jaynstan_oauth_state', state, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000,
      path: '/api/auth/google/callback',
    });
    return response.redirect(this.auth.getGoogleAuthorizationUrl(state));
  }

  @Get('auth/google/callback')
  @ApiOperation({ summary: 'Complete Google OAuth and redirect with a short-lived exchange code' })
  async completeGoogleSignIn(
    @Req() request: Request,
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() response: Response,
  ) {
    const cookieState = this.readCookie(request, 'jaynstan_oauth_state');
    response.clearCookie('jaynstan_oauth_state', { path: '/api/auth/google/callback' });
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:2000');
    try {
      if (!code) throw new BadRequestException('Google did not return an authorization code.');
      const exchangeCode = await this.auth.finishGoogleSignIn(code, state, cookieState);
      return response.redirect(`${frontendUrl}/auth/google/callback?code=${encodeURIComponent(exchangeCode)}`);
    } catch {
      return response.redirect(`${frontendUrl}/auth/google/callback?error=google_sign_in_failed`);
    }
  }

  @Post('auth/google/exchange')
  @HttpCode(200)
  @ApiOperation({ summary: 'Exchange a single-use Google sign-in code for an access token' })
  exchangeGoogleCode(@Body('code') code: string) {
    if (typeof code !== 'string' || !code) throw new BadRequestException('A Google sign-in code is required.');
    return this.auth.exchangeGoogleCode(code);
  }

  @Post('provider-applications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply to become a provider' })
  applyAsProvider(@CurrentUser() user: AuthenticatedUser, @Body() dto: ProviderApplicationDto) {
    return this.auth.createProviderApplication(user.id, dto);
  }

  @Get('provider-applications/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'View the current user’s latest provider application' })
  myProviderApplication(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.getMyProviderApplication(user.id);
  }

  @Get('admin/provider-applications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List provider applications for administrators' })
  listProviderApplications(@Query('status') status?: string) {
    if (status && !['pending', 'approved', 'rejected'].includes(status)) {
      throw new BadRequestException('Status must be pending, approved, or rejected.');
    }
    return this.auth.listProviderApplications(status as 'pending' | 'approved' | 'rejected' | undefined);
  }

  @Patch('admin/provider-applications/:id/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve or reject a provider application' })
  reviewProviderApplication(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() reviewer: AuthenticatedUser,
    @Body() dto: ReviewApplicationDto,
  ) {
    return this.auth.reviewProviderApplication(id, reviewer.id, dto.decision, dto.reviewNote);
  }

  @Patch('admin/provider-applications/:id/revoke')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke an approved provider application' })
  revokeProviderApplication(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() reviewer: AuthenticatedUser, @Body('reviewNote') reviewNote?: string) {
    return this.auth.revokeProviderApplication(id, reviewer.id, reviewNote);
  }

  private readCookie(request: Request, name: string): string {
    const cookieHeader = request.headers.cookie ?? '';
    const entry = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
    return entry ? decodeURIComponent(entry.slice(name.length + 1)) : '';
  }
}
