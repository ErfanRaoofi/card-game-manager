import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Patch,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
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

  /** ساخت کاربر جدید داخل صفحه اتاق بدون تغییر سشن کاربر جاری */
  @Post('register-player')
  async registerPlayer(
    @Body() body: { username: string; password?: string; displayName?: string },
    @Headers('authorization') authHeader?: string,
  ) {
    const token = this.extractToken(authHeader);
    this.authService.verifyToken(token);

    const username = body.username?.trim();
    if (!username) throw new BadRequestException('نام کاربری الزامی است');
    const password = body.password?.trim() || username;
    const user = await this.userService.register(username, password, body.displayName);
    return this.userService.toPublic(user);
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

  /** تغییر مشخصات حساب فعلی بعد از ورود */
  @Patch('me')
  async updateMe(
    @Body() body: { username?: string; password?: string; displayName?: string },
    @Headers('authorization') authHeader?: string,
  ) {
    const token = this.extractToken(authHeader);
    const payload = this.authService.verifyToken(token);
    return this.userService.updateOwnCredentials(payload.sub, body);
  }

  private extractToken(authHeader?: string): string {
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('توکن ارسال نشده است');
    }
    return authHeader.slice(7);
  }
}
