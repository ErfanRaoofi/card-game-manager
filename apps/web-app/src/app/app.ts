import { Component, inject, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SocketService } from './socket.service';

@Component({
  imports: [CommonModule, RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  messages: any[] = [];

  private socketService = inject(SocketService);
  ngOnInit() {
    // گوش دادن به پیام‌هایی که از سمت بک‌اند می‌آید
    this.socketService.getRoomMessages().subscribe((data) => {
      this.messages.push(data);
    });
  }

  joinTestRoom() {
    this.socketService.joinRoom('Room-1');
  }
}
