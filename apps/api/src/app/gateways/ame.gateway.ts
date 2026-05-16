import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

// cors را فعال می‌کنیم تا فرانت‌اند انگولار بتواند بدون مشکل به آن وصل شود
@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // وقتی کاربری متصل می‌شود
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  // وقتی کاربری قطع می‌شود
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // رویداد: ورود کاربر به یک روم خاص
  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.roomId);
    console.log(`Client ${client.id} joined room ${data.roomId}`);

    // ارسال پیام به تمام افراد حاضر در آن روم
    this.server.to(data.roomId).emit('roomMessage', {
      message: `یک کاربر جدید وارد روم ${data.roomId} شد.`,
    });
  }
}
