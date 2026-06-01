// src/room/room.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { RoomEntity } from './room.entity';
import { RoomService } from './room.service';
import { RoomGateway } from './room.gateway';
import { RoomController } from './room.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RoomEntity]), UserModule],
  // AuthService از UserModule برای تأیید توکن در Gateway
  controllers: [RoomController],
  providers: [RoomService, RoomGateway],
  exports: [RoomService],
})
export class RoomModule {}
