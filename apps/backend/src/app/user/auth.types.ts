import { UserRole } from '@fe/shared-types';

export interface JwtPayload {
  sub: string;
  username: string;
  displayName: string;
  role: UserRole;
  exp?: number;
}
