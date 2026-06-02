import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '@fe/shared-types';
import { RoomMemberEntity } from './room-member.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 32 })
  username: string;

  @Column({ length: 128 })
  passwordHash: string;

  @Column({ length: 64 })
  displayName: string;

  @Column({ type: 'varchar', length: 16, default: 'player' })
  role: UserRole;

  @OneToMany(() => RoomMemberEntity, (m) => m.user)
  roomMemberships: RoomMemberEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
