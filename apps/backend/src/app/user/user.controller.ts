import { Controller, Get, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  /** لیست کاربران ثبت‌شده — برای انتخاب بازیکن در اتاق */
  @Get()
  list(@Headers('authorization') authHeader?: string) {
    if (authHeader?.startsWith('Bearer ')) {
      this.authService.verifyToken(authHeader.slice(7));
    }
    return this.userService.listUsers();
  }
}
