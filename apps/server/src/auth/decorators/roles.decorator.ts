import { SetMetadata } from '@nestjs/common';
import type { UserRole } from '../provider-categories.js';

export const ROLES_KEY = 'jaynstan:roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
