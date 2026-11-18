import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service.js';
import type { AuthenticatedUser } from '../auth/provider-categories.js';

type OptionalUserRequest = Request & { user?: AuthenticatedUser };

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<OptionalUserRequest>();
    const match = request.headers.authorization?.match(/^Bearer\s+(.+)$/i);
    if (match) {
      try { request.user = await this.auth.authenticateAccessToken(match[1]); }
      catch { request.user = undefined; }
    }
    return true;
  }
}
