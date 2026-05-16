import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RoomMember } from './room-member.entity';
import { GameLog } from './game-log.entity';

@Entity()
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // نام اتاق (مثلا: بازی شب جمعه)

  @Column()
  gameType: string; // hokm, shelem, 11

  @OneToMany(() => RoomMember, (member) => member.room)
  members: RoomMember[];

  @OneToMany(() => GameLog, (log) => log.room)
  logs: GameLog[];
}
