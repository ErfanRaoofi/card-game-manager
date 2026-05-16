import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { Room } from './room.entity';

@Entity()
export class GameLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Room, (room) => room.logs)
  room: Room;

  @Column()
  team1Score: number;

  @Column()
  team2Score: number;

  @Column({ nullable: true })
  hokm: string; // حکم انتخاب شده (پیک، دل و...)

  @CreateDateColumn()
  createdAt: Date;
}
