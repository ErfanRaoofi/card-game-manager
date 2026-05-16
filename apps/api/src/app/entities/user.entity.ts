import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { RoomMember } from './room-member.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  username: string;

  @OneToMany(() => RoomMember, (member) => member.user)
  roomMemberships: RoomMember[];
}
