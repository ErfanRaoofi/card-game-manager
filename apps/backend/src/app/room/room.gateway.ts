// src/room/room.gateway.ts

import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  HandPointType,
  JoinRoomPayload,
  RecordHandPayload,
  SetupPlayerInput,
  TeamId,
} from '@fe/shared-types';
import { AuthService } from '../user/auth.service';
import { RoomService } from './room.service';

interface SocketData {
  userId?: string;
  username?: string;
  displayName?: string;
}

@WebSocketGateway({ cors: true })
export class RoomGateway {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly roomService: RoomService,
    private readonly authService: AuthService,
  ) {}

  private bindUser(
    client: Socket,
    userId: string,
    username: string,
    displayName: string,
  ): void {
    const data = client.data as SocketData;
    data.userId = userId;
    data.username = username;
    data.displayName = displayName;
  }

  private getUserId(client: Socket): string {
    return (client.data as SocketData).userId ?? '';
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: JoinRoomPayload,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const payload = this.authService.verifyToken(data.token);
      this.bindUser(client, payload.sub, payload.username, payload.displayName);
      const state = await this.roomService.joinRoom(
        data.roomId,
        client.id,
        payload.sub,
        payload.displayName,
        data.hostToken,
      );
      client.join(data.roomId);
      client.emit('roomStateUpdated', state);
      this.server.to(data.roomId).emit('roomStateUpdated', state);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('setupPlayers')
  async handleSetupPlayers(
    @MessageBody()
    data: { roomId: string; players: SetupPlayerInput[]; hakemIndex: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const state = await this.roomService.setupPlayers(
        data.roomId,
        client.id,
        this.getUserId(client),
        data.players,
        data.hakemIndex,
      );
      this.server.to(data.roomId).emit('roomStateUpdated', state);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('setHakem')
  async handleSetHakem(
    @MessageBody() data: { roomId: string; playerId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const state = await this.roomService.setHakem(
        data.roomId,
        client.id,
        this.getUserId(client),
        data.playerId,
      );
      this.server.to(data.roomId).emit('roomStateUpdated', state);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('setHokm')
  async handleSetHokm(
    @MessageBody() data: { roomId: string; hokm: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const state = await this.roomService.setHokm(
        data.roomId,
        client.id,
        this.getUserId(client),
        data.hokm,
      );
      this.server.to(data.roomId).emit('roomStateUpdated', state);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('recordHand')
  async handleRecordHand(
    @MessageBody() data: RecordHandPayload,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const state = await this.roomService.recordHand(
        data.roomId,
        client.id,
        this.getUserId(client),
        data.pointType,
        {
          teamId: data.teamId,
          playerId: data.playerId,
        },
      );
      this.server.to(data.roomId).emit('roomStateUpdated', state);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('undoLastScore')
  async handleUndoLastScore(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const state = await this.roomService.undoLastScore(
        data.roomId,
        client.id,
        this.getUserId(client),
      );
      this.server.to(data.roomId).emit('roomStateUpdated', state);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('confirmSetNext')
  async handleConfirmSetNext(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const state = await this.roomService.confirmSetNext(
        data.roomId,
        client.id,
        this.getUserId(client),
      );
      this.server.to(data.roomId).emit('roomStateUpdated', state);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('pointWon')
  async handlePointWon(
    @MessageBody()
    data: { roomId: string; teamId?: TeamId; winningTeam?: 1 | 2 },
    @ConnectedSocket() client: Socket,
  ) {
    const teamId =
      data.teamId ?? (data.winningTeam === 1 ? 'team1' : data.winningTeam === 2 ? 'team2' : undefined);
    if (!teamId) {
      client.emit('error', { message: 'تیم برنده مشخص نشده است' });
      return;
    }
    try {
      const state = await this.roomService.recordHand(
        data.roomId,
        client.id,
        this.getUserId(client),
        'NORMAL',
        { teamId },
      );
      this.server.to(data.roomId).emit('roomStateUpdated', state);
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }
}
