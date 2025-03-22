import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Users } from "./Users"; // Import Entity ของ User ที่สร้างไว้
import { Activity } from "./Activity"; // Import Entity ของ Activity ที่สร้างไว้

@Entity("useractivity")
export class UserActivity {
  @PrimaryGeneratedColumn()
  uac_id!: number;

  @ManyToOne(() => Users, (users) => users.u_id, {
    onUpdate: "NO ACTION",
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "u_id" })
  user!: Users;

  @ManyToOne(() => Activity, (activity) => activity.ac_id, {
    onUpdate: "NO ACTION",
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "ac_id" })
  activity!: Activity;

  @Column({ type: "timestamp", nullable: true })
  uac_checkin?: Date;

  @Column({ type: "timestamp", nullable: true })
  uac_checkout?: Date;

  @Column({ type: "boolean", default: false })
  uac_take_assessment?: boolean;
}
