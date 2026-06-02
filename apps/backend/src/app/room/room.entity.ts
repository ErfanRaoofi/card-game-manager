// src/room/room.entity.ts

import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { RoomState } from '@fe/shared-types';

@Entity('rooms')
export class RoomEntity {
  @PrimaryGeneratedColumn('uuid')
  roomId: string;
    
  @Column({ type: 'jsonb' })
  state: RoomState;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
