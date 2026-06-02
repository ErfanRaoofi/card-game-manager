import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UpdateUserDto } from '@fe/shared-types';
import { AdminGuard } from './admin.guard';
import { RoomService } from '../room/room.service';
import { UserService } from './user.service';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly userService: UserService,
    private readonly roomService: RoomService,
  ) {}

  @Get('users')
  listUsers() {
    return this.userService.listUsersForAdmin();
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() body: UpdateUserDto) {
    return this.userService.updateUserAsAdmin(id, body);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.userService.deleteUserAsAdmin(id);
  }

  @Get('rooms')
  listRooms() {
    return this.roomService.listRoomsForAdmin();
  }

  @Delete('rooms/:roomId')
  deleteRoom(@Param('roomId') roomId: string) {
    return this.roomService.deleteRoom(roomId);
  }
}
