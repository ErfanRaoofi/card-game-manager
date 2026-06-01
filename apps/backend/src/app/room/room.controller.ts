// src/room/room.controller.ts

import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { RoomService } from './room.service';

@Controller('rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @Get()
  async listRooms() {
    return this.roomService.listRooms();
  }

  @Get(':roomId')
  async getRoom(@Param('roomId') roomId: string) {
    return this.roomService.getRoomState(roomId);
  }

  @Post()
  async createRoom(@Body('gameType') gameType?: string) {
    const roomState = await this.roomService.createRoom(gameType ?? 'HOKM');

    return {
      message: 'Room created successfully',
      roomId: roomState.roomId,
      gameType: roomState.gameType,
    };
  }
}
