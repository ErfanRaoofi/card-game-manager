import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;

  constructor() {
    // پورت پیش‌فرض NestJS در Nx معمولا 3000 است.
    // اگر پورت شما متفاوت است، آن را تغییر دهید.
    this.socket = io('http://localhost:3000');
  }

  // متد برای درخواست ورود به روم
  joinRoom(roomId: string) {
    this.socket.emit('joinRoom', { roomId });
  }

  // متد برای دریافت لحظه‌ای پیام‌های روم
  getRoomMessages(): Observable<any> {
    return new Observable((observer) => {
      this.socket.on('roomMessage', (data) => {
        observer.next(data);
      });
    });
  }
}
