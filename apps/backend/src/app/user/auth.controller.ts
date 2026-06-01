import { Body, Controller, Get, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from './user.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  register(@Body() body: { username: string; password: string; displayName?: string }) {
    return this.authService.register(body.username, body.password, body.displayName);
  }

  @Post('login')
  login(@Body() body: { username: string; password: string }) {
    return this.authService.login(body.username, body.password);
  }

  @Get('me')
  async me(@Headers('authorization') authHeader?: string) {
    const token = this.extractToken(authHeader);
    const payload = this.authService.verifyToken(token);
    const user = await this.userService.findById(payload.sub);
    if (!user) throw new UnauthorizedException('کاربر یافت نشد');
    return this.userService.toPublic(user);
  }

  private extractToken(authHeader?: string): string {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('توکن ارسال نشده است');
    }
    return authHeader.slice(7);
  }
}
