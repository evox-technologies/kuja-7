import { SetMetadata } from '@nestjs/common';
import { Permission } from './permissions';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Requires every listed permission. Mirrors the @Roles convention: a
 * method-level decorator fully replaces the class-level one.
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
