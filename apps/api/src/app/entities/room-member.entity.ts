import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { User } from './user.entity';
import { Room } from './room.entity';

@Entity()
export class RoomMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.roomMemberships)
  user: User;

  @ManyToOne(() => Room, room => room.members)
  room: Room;

  @Column({ default: false })
  isHakem: boolean; // آیا این شخص الان حاکم است؟

  @Column()
  team: number; // تیم 1 یا 2
}
