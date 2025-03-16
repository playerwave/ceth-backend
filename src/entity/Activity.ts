import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Assessment } from "./Assessment";

@Entity("activity")
export class Activity {
  @PrimaryGeneratedColumn()
  ac_id!: number;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
    default: "Activity Name",
  }) // ✅ เปลี่ยนจาก false -> true
  ac_name?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  ac_company_lecturer?: string;

  @Column({ type: "text", nullable: true })
  ac_description?: string;

  @Column({
    type: "varchar",
    length: 100,
    nullable: true,
    default: "Soft Skill",
  })
  ac_type?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  ac_room?: string;

  @Column({ type: "int", nullable: true }) // ✅ เปลี่ยนจาก false -> true
  ac_seat?: number;

  @Column({ type: "text", nullable: true }) // ✅ รองรับ JSON string
  ac_food?: string;

  @Column({ type: "varchar", length: 50, nullable: true, default: "private" })
  ac_status?: string;

  @Column({ type: "varchar", length: 10, nullable: true })
  ac_location_type?: string;

  @Column({ type: "varchar", length: 20, nullable: true, default: "Not Start" })
  ac_state?: string;

  @Column({ type: "timestamp", nullable: true })
  ac_start_register?: Date | null;

  @Column({ type: "timestamp", nullable: true }) // ✅ เปลี่ยนจาก false -> true
  ac_end_register?: Date;

  @Column({
    type: "timestamp",
    nullable: true,
    default: () => "CURRENT_TIMESTAMP",
  })
  ac_create_date?: Date;

  @Column({ type: "timestamp", nullable: true, onUpdate: "CURRENT_TIMESTAMP" })
  ac_last_update?: Date;

  @Column({ type: "int", nullable: true, default: 0 })
  ac_registered_count?: number;

  @Column({ type: "int", nullable: true, default: 0 })
  ac_attended_count?: number;

  @Column({ type: "int", nullable: true, default: 0 })
  ac_not_attended_count?: number;

  @Column({ type: "timestamp", nullable: true, default: null }) // ✅ เปลี่ยนจาก false -> true
  ac_start_time?: Date;

  @Column({ type: "timestamp", nullable: true, default: null }) // ✅ เปลี่ยนจาก false -> true
  ac_end_time?: Date;

  @Column({ type: "int", nullable: true, default: 0 })
  ac_recieve_hours?: number;

  @Column({ type: "varchar", nullable: true }) // ✅ เก็บเป็น binary (Base64)
  ac_image_url?: string;

  @Column({ type: "timestamp", nullable: true, default: null }) // ✅ เปลี่ยนจาก false -> true
  ac_normal_register?: Date;

  @Column({ type: "timestamp", nullable: true, default: null }) // ✅ เปลี่ยนจาก false -> true
  ac_start_assessment?: Date;

  @Column({ type: "timestamp", nullable: true, default: null }) // ✅ เปลี่ยนจาก false -> true
  ac_end_assessment?: Date;

  @ManyToOne(() => Assessment, (assessment) => assessment.activities, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "assessment_id" }) // ✅ เพิ่มบรรทัดนี้
  assessment?: Assessment | null;
}
