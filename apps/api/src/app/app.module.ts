import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Room } from './entities/room.entity';
import { RoomMember } from './entities/room-member.entity';
import { GameLog } from './entities/game-log.entity';
import { GameGateway } from './gateways/ame.gateway';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'root', // نام کاربری دیتابیس شما
      password: 'rootpassword', // رمز عبور دیتابیس شما
      database: 'card_game_db', // نام دیتابیس (باید از قبل در پستگرس ساخته شده باشد)
      entities: [User, Room, RoomMember, GameLog],
      synchronize: true, // فقط در محیط توسعه (Development)
      // logging: true, // موقتا این را true کنید تا لاگ ساخت جدول‌ها را در ترمینال ببینید
    }),
  ],
  controllers: [AppController],
  providers: [AppService, GameGateway],
})
export class AppModule {}
