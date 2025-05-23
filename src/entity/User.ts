import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { EventCoop } from "./EventCoop";
import { UserActivity } from "./UserActivity";
import { Certificate } from "./Certificate";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  u_id!: number; // Primary Key

  @Column({ type: "varchar", length: 100, unique: true })
  u_email!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  u_fullname?: string;

  @Column({ type: "varchar", length: 100, default: "student" })
  u_role!: string; // Role (admin, student)

  @Column({ type: "varchar", length: 100, nullable: true, unique: true })
  u_std_id?: string; // รหัสนิสิต

  @Column({ type: "int", default: 0 })
  u_soft_hours?: number;

  @Column({ type: "int", default: 0 })
  u_hard_hours?: number;

  @Column({ type: "int", nullable: true })
  u_risk_soft?: number;

  @Column({ type: "int", nullable: true })
  u_risk_hard?: number;

  @Column({ type: "varchar", length: 50, nullable: true })
  u_risk_status?: string;

  @OneToMany(() => UserActivity, (userActivity) => userActivity.user)
  userActivities!: UserActivity[];

  @OneToMany(() => Certificate, (certificate) => certificate.user)
  certificates!: Certificate[];

  @ManyToOne(() => EventCoop, (event) => event.users)
  @JoinColumn({ name: "e_id" })
  eventCoop?: EventCoop;
}
