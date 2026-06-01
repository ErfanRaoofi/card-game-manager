import { RedisModule } from '@nestjs-modules/ioredis';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RoomEntity } from './room/room.entity'; // مسیر فایل انتیتی را تنظیم کنید
import { RoomModule } from './room/room.module';
import { UserModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'hokmdb',
      autoLoadEntities: true,
      synchronize: true,
    }),
    UserModule,
    RoomModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
