import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RoomMemberEntity } from './room-member.entity';
import { UserEntity } from './user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, RoomMemberEntity])],
  controllers: [AuthController, UserController],
  providers: [UserService, AuthService],
  exports: [UserService, AuthService],
})
export class UserModule {}
