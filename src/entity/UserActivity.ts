import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Users } from './Users'; // Import Entity ของ User ที่สร้างไว้
import { Activity } from './Activity'; // Import Entity ของ Activity ที่สร้างไว้

// @Entity("user_activity")
// export class UserActivity {
//   @PrimaryGeneratedColumn()
//   uac_id!: number; // Primary Key

//   @ManyToOne(() => User, (user) => user.userActivities, {
//     onDelete: "CASCADE",
//   })
//   @JoinColumn({ name: "u_id" })
//   user!: User;

//   @ManyToOne(() => Activity, (activity) => activity.userActivities, {
//     onDelete: "CASCADE",
//   })
//   @JoinColumn({ name: "ac_id" })
//   activity!: Activity;

//   @Column({ type: "timestamp", nullable: true })
//   uac_checkin?: Date;

//   @Column({ type: "timestamp", nullable: true })
//   uac_checkout?: Date;

//   @Column({ type: "boolean", default: false })
//   uac_take_assessment?: boolean;
// }

@Entity("useractivity")
export class UserActivity {
  @PrimaryGeneratedColumn()
  uac_id!: number;
  uac_id!: number;

  @ManyToOne(() => User, (user) => user.userActivities, { onDelete: "CASCADE" })
  @JoinColumn({ name: "u_id" })
  user!: User;

  @ManyToOne(() => Activity, (activity) => activity.ac_id, {
    onUpdate: 'NO ACTION',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ac_id' })
  activity!: Activity;

  @Column({ type: 'timestamp', nullable: true })
  uac_checkin?: Date;

  @Column({ type: 'timestamp', nullable: true })
  uac_checkout?: Date;

  @Column({ type: "varchar", length: 100, nullable: true })
  uac_selected_food?: string; // ฟิลด์ใหม่ที่เพิ่มเข้ามา

  @Column({ type: "boolean", default: false })
  uac_take_assessment?: boolean;
}
