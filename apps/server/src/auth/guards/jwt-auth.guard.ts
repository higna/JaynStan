import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth.service.js';
import type { AuthenticatedRequest } from '../decorators/current-user.decorator.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & Partial<AuthenticatedRequest>>();
    const authorization = request.headers.authorization;
    const match = authorization?.match(/^Bearer\s+(.+)$/i);
    if (!match) throw new UnauthorizedException('A bearer access token is required.');
    request.user = await this.auth.authenticateAccessToken(match[1]);
    return true;
  }
}
