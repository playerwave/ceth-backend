import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
// import { EventCoop } from "./EventCoop";
import { UserActivity } from './UserActivity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  u_id!: number; // Primary Key

  // @ManyToOne(() => EventCoop, { nullable: true }) // เชื่อมกับ EventCoop
  // @JoinColumn({ name: "e_id" })
  // eventCoop?: EventCoop;

  @Column({ type: 'varchar', length: 255, nullable: true })
  u_fullname?: string;

  @Column({ type: 'varchar', length: 100, default: 'student' })
  u_role!: string; // Role (admin, student)

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  u_std_id?: string; // รหัสนิสิต

  @Column({ type: 'int', default: 0 })
  u_risk_soft?: number;

  @Column({ type: 'int', default: 0 })
  u_risk_hard?: number;

  @Column({ type: 'int', default: 0 })
  u_soft_hours?: number;

  @Column({ type: 'int', default: 0 })
  u_hard_hours?: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  u_department?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  u_risk_status?: string; // สถานะความเสี่ยง

  @OneToMany(() => UserActivity, (userActivity) => userActivity.user)
  userActivities!: UserActivity[];
}
