import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { RoomEntity } from '../room/room.entity';

@Entity('room_members')
@Unique(['roomId', 'userId'])
export class RoomMemberEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  roomId: string;

  @Column('uuid')
  userId: string;

  @Column({ length: 64 })
  username: string;

  @Column({ type: 'varchar', nullable: true })
  socketId: string | null;

  @Column({ default: false })
  isHost: boolean;

  @ManyToOne(() => RoomEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'roomId', referencedColumnName: 'roomId' })
  room: RoomEntity;

  @ManyToOne(() => UserEntity, (u) => u.roomMemberships, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: UserEntity;

  @CreateDateColumn()
  joinedAt: Date;

  @UpdateDateColumn()
  lastSeenAt: Date;
}
