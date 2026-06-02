import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from './user.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ headers: { authorization?: string } }>();
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('ورود لازم است');
    }
    const payload = this.authService.verifyToken(authHeader.slice(7));
    const user = await this.userService.findById(payload.sub);
    if (!user) throw new UnauthorizedException('کاربر یافت نشد');
    if (user.role !== 'admin') {
      throw new ForbiddenException('فقط مدیر دسترسی دارد');
    }
    return true;
  }
}
