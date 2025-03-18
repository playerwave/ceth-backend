import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, JoinColumn } from "typeorm";
import { User } from "./User";
import { Activity } from "./Activity";

@Entity("user_activity")
export class UserActivity {
  @PrimaryGeneratedColumn()
  uac_id!: number; // Primary Key

  @ManyToOne(() => User, (user) => user.activities, { onDelete: "CASCADE" })
  @JoinColumn({ name: "u_id" }) // FK ไปที่ User
  user!: User;

  @ManyToOne(() => Activity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ac_id" }) // FK ไปที่ Activity
  activity!: Activity;

  @Column({ type: "timestamp", nullable: true })
  uac_checkin?: Date; // เวลาที่เข้าร่วมกิจกรรม

  @Column({ type: "timestamp", nullable: true })
  uac_checkout?: Date; // เวลาที่ออกจากกิจกรรม

  @Column({ type: "boolean", default: false })
  uac_take_assessment?: boolean; // ได้ทำแบบประเมินหรือยัง
}
