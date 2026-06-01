import { createHmac, timingSafeEqual } from 'crypto';
import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtPayload } from './auth.types';
import { UserService } from './user.service';

const JWT_SECRET = process.env['JWT_SECRET'] ?? 'hokm-dev-secret-change-in-production';
const TOKEN_TTL_SEC = 60 * 60 * 24 * 30;

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async register(username: string, password: string, displayName?: string) {
    const user = await this.userService.register(username, password, displayName);
    const token = this.signToken(user);
    return { token, user: this.userService.toPublic(user) };
  }

  async login(username: string, password: string) {
    const user = await this.userService.validateLogin(username, password);
    const token = this.signToken(user);
    return { token, user: this.userService.toPublic(user) };
  }

  verifyToken(token: string): JwtPayload {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) throw new Error('invalid');
      const [header, body, signature] = parts;
      const expected = createHmac('sha256', JWT_SECRET)
        .update(`${header}.${body}`)
        .digest('base64url');
      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expected);
      if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
        throw new Error('invalid signature');
      }
      const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as JwtPayload & {
        exp: number;
      };
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        throw new UnauthorizedException('توکن منقضی شده است');
      }
      return payload;
    } catch (e) {
      if (e instanceof UnauthorizedException) throw e;
      throw new UnauthorizedException('ورود نامعتبر است — دوباره وارد شوید');
    }
  }

  private signToken(user: { id: string; username: string; displayName: string; role: string }) {
    const payload: Omit<JwtPayload, 'exp'> = {
      sub: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role as JwtPayload['role'],
    };
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(
      JSON.stringify({
        ...payload,
        exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SEC,
      }),
    ).toString('base64url');
    const signature = createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');
    return `${header}.${body}.${signature}`;
  }
}
