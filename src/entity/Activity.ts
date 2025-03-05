import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Assessment } from "./Assesment";

@Entity("activity")
export class Activity {
  @PrimaryGeneratedColumn()
  ac_id!: number;

  @Column({ type: "varchar", length: 255, nullable: false })
  ac_name!: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  ac_company_lecturer!: string;

  @Column({ type: "text", nullable: false })
  ac_description!: string;

  @Column({ type: "varchar", length: 100, nullable: false })
  ac_type!: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  ac_room?: string;

  @Column({ type: "int", nullable: false })
  ac_seat!: number;

  @Column({ type: "varchar", length: 100, nullable: true })
  ac_food?: string;

  @Column({ type: "varchar", length: 50, nullable: false, default: "private" })
  ac_status!: string;

  @Column({ type: "varchar", length: 10, nullable: false })
  ac_location_type!: string;

  @Column({
    type: "varchar",
    length: 20,
    nullable: false,
    default: "Not Start",
  })
  ac_state!: string;

  @Column({ type: "timestamp", nullable: false })
  ac_start_register!: Date;

  @Column({ type: "timestamp", nullable: false })
  ac_end_register!: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  ac_create_date!: Date;

  @Column({ type: "timestamp", nullable: true, onUpdate: "CURRENT_TIMESTAMP" })
  ac_last_update?: Date;

  @Column({ type: "int", nullable: false, default: 0 })
  ac_registered_count!: number;

  @Column({ type: "int", nullable: false, default: 0 })
  ac_attended_count!: number;

  @Column({ type: "int", nullable: false, default: 0 })
  ac_not_attended_count!: number;

  @Column({ type: "timestamp", nullable: false })
  ac_start_time!: Date;

  @Column({ type: "timestamp", nullable: false })
  ac_end_time!: Date;

  @Column({ type: "varchar", length: 255, nullable: false })
  ac_image_url!: string;

  @Column({ type: "timestamp", nullable: false })
  ac_normal_register!: Date;

  // ✅ แก้ให้ assessment รองรับ undefined ได้ และกำหนด `nullable: true`
  @ManyToOne(() => Assessment, (assessment) => assessment.activities, {
    nullable: true,
    onDelete: "SET NULL",
  })
  assessment!: Assessment | null; // ✅ เปลี่ยนจาก `assessment?` เป็น `assessment!: Assessment | null`
}
