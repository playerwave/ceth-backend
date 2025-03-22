import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Certificate } from './Certificate'; // เพิ่มการ import Certificate

import { EventCoop } from './EventCoop';

@Entity('users')
export class Users {
  @PrimaryGeneratedColumn()
  u_id!: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  u_email!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  u_password?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  u_fullname?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  u_role?: string;

  @Column({ type: 'varchar', length: 9, unique: true })
  u_std_id!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  u_domain?: string;

  @Column({ type: 'int', nullable: true })
  u_risk_soft?: number;

  @Column({ type: 'int', nullable: true })
  u_risk_hard?: number;

  @Column({ type: 'int', nullable: true })
  u_soft_hours?: number;

  @Column({ type: 'int', nullable: true })
  u_hard_hours?: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  u_risk_status?: string;

  @ManyToOne(() => EventCoop, (event) => event.users)
  @JoinColumn({ name: 'e_id' })
  eventCoop?: EventCoop;

  @OneToMany(() => Certificate, (certificate) => certificate.user)
  certificates?: Certificate[]; // เพิ่มการเชื่อมโยงระหว่าง User กับ Certificate
}
