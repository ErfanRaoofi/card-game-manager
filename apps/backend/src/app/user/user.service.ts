import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { AdminUserDetail, AppUser, RoomMember, UpdateUserDto, UserRole } from '@fe/shared-types';
import { RoomMemberEntity } from './room-member.entity';
import { UserEntity } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
    @InjectRepository(RoomMemberEntity)
    private readonly membersRepo: Repository<RoomMemberEntity>,
  ) {}

  toPublic(user: UserEntity): AppUser {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    };
  }

  toAdminDetail(user: UserEntity): AdminUserDetail {
    return {
      ...this.toPublic(user),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }

  async register(username: string, password: string, displayName?: string): Promise<UserEntity> {
    const trimmed = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,32}$/.test(trimmed)) {
      throw new BadRequestException('نام کاربری: ۳–۳۲ حرف، فقط حروف انگلیسی، عدد و _');
    }
    if (password.length < 4) {
      throw new BadRequestException('رمز عبور حداقل ۴ کاراکتر');
    }

    const exists = await this.usersRepo.findOne({ where: { username: trimmed } });
    if (exists) throw new ConflictException('این نام کاربری قبلاً ثبت شده است');

    const passwordHash = await bcrypt.hash(password, 10);
    const count = await this.usersRepo.count();
    const role: UserRole = count === 0 ? 'admin' : 'player';
    const user = this.usersRepo.create({
      username: trimmed,
      passwordHash,
      displayName: (displayName?.trim() || trimmed) as string,
      role,
    });
    return this.usersRepo.save(user);
  }

  async updateOwnCredentials(
    userId: string,
    dto: { username?: string; password?: string; displayName?: string },
  ): Promise<AppUser> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('کاربر یافت نشد');

    if (dto.username !== undefined) {
      const trimmed = dto.username.trim().toLowerCase();
      if (!/^[a-z0-9_]{3,32}$/.test(trimmed)) {
        throw new BadRequestException('نام کاربری: ۳–۳۲ حرف، فقط حروف انگلیسی، عدد و _');
      }
      if (trimmed !== user.username) {
        const exists = await this.usersRepo.findOne({ where: { username: trimmed } });
        if (exists && exists.id !== user.id) {
          throw new ConflictException('این نام کاربری قبلاً ثبت شده است');
        }
        user.username = trimmed;
      }
    }

    if (dto.displayName !== undefined) {
      const name = dto.displayName.trim();
      if (!name) throw new BadRequestException('نام نمایشی خالی است');
      user.displayName = name;
    }

    if (dto.password !== undefined) {
      if (dto.password.length < 4) {
        throw new BadRequestException('رمز عبور حداقل ۴ کاراکتر');
      }
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const saved = await this.usersRepo.save(user);
    return this.toPublic(saved);
  }

  async listUsersForAdmin(): Promise<AdminUserDetail[]> {
    const users = await this.usersRepo.find({ order: { createdAt: 'DESC' } });
    return users.map((u) => this.toAdminDetail(u));
  }

  async updateUserAsAdmin(id: string, dto: UpdateUserDto): Promise<AdminUserDetail> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new BadRequestException('کاربر یافت نشد');

    if (dto.displayName !== undefined) {
      const name = dto.displayName.trim();
      if (!name) throw new BadRequestException('نام نمایشی خالی است');
      user.displayName = name;
    }
    if (dto.role !== undefined) {
      user.role = dto.role;
    }
    if (dto.password !== undefined) {
      if (dto.password.length < 4) {
        throw new BadRequestException('رمز عبور حداقل ۴ کاراکتر');
      }
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const saved = await this.usersRepo.save(user);
    return this.toAdminDetail(saved);
  }

  async deleteUserAsAdmin(id: string): Promise<{ deleted: boolean }> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new BadRequestException('کاربر یافت نشد');
    await this.usersRepo.remove(user);
    return { deleted: true };
  }

  async validateLogin(username: string, password: string): Promise<UserEntity> {
    const trimmed = username.trim().toLowerCase();
    const user = await this.usersRepo.findOne({ where: { username: trimmed } });
    if (!user) throw new UnauthorizedException('نام کاربری یا رمز عبور اشتباه است');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('نام کاربری یا رمز عبور اشتباه است');

    return user;
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.usersRepo.findOne({ where: { id } });
  }

  async listUsers(): Promise<AppUser[]> {
    const users = await this.usersRepo.find({ order: { displayName: 'ASC' } });
    return users.map((u) => this.toPublic(u));
  }

  async upsertRoomMember(
    roomId: string,
    userId: string,
    username: string,
    socketId: string,
    isHost: boolean,
  ): Promise<RoomMemberEntity> {
    let member = await this.membersRepo.findOne({ where: { roomId, userId } });
    if (member) {
      member.username = username;
      member.socketId = socketId;
      member.isHost = isHost;
    } else {
      member = this.membersRepo.create({
        roomId,
        userId,
        username,
        socketId,
        isHost,
      });
    }
    return this.membersRepo.save(member);
  }

  async setRoomHost(
    roomId: string,
    userId: string,
    username: string,
    socketId: string,
  ): Promise<void> {
    await this.membersRepo.update({ roomId }, { isHost: false });
    await this.upsertRoomMember(roomId, userId, username, socketId, true);
  }

  async getRoomMembers(roomId: string): Promise<RoomMember[]> {
    const rows = await this.membersRepo.find({
      where: { roomId },
      order: { isHost: 'DESC', lastSeenAt: 'DESC' },
    });
    return rows.map((r) => ({
      userId: r.userId,
      username: r.username,
      socketId: r.socketId,
    }));
  }

  async getRoomHost(roomId: string): Promise<RoomMemberEntity | null> {
    return this.membersRepo.findOne({ where: { roomId, isHost: true } });
  }
}
