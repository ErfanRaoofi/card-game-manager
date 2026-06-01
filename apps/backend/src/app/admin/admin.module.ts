import { Module } from '@nestjs/common';
import { AdminController } from '../user/admin.controller';
import { AdminGuard } from '../user/admin.guard';
import { RoomModule } from '../room/room.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule, RoomModule],
  controllers: [AdminController],
  providers: [AdminGuard],
})
export class AdminModule {}
