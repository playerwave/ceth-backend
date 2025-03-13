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

  @Column({ type: "text", nullable: true }) // ✅ แก้เป็น text เพื่อรองรับ JSON
  ac_food?: string; // ต้องใช้ JSON.stringify ก่อนบันทึก

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

  @Column({ type: "timestamp", nullable: true })
  ac_start_register?: Date | null;

  @Column({ type: "timestamp", nullable: false })
  ac_end_register!: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  ac_create_date!: Date;

  @Column({ type: "timestamp", nullable: false, onUpdate: "CURRENT_TIMESTAMP" })
  ac_last_update!: Date;

  @Column({ type: "int", nullable: false, default: 0 })
  ac_registered_count!: number;

  @Column({ type: "int", nullable: false, default: 0 })
  ac_attended_count!: number;

  @Column({ type: "int", nullable: false, default: 0 })
  ac_not_attended_count!: number;

  @Column({ type: "timestamp", nullable: false }) // ✅ ต้องเป็น timestamp ไม่ใช่ string
  ac_start_time!: Date;

  @Column({ type: "timestamp", nullable: false }) // ✅ ต้องเป็น timestamp ไม่ใช่ string
  ac_end_time!: Date;

  @Column({ type: "int", nullable: true, default: 0 })
  ac_recieve_hours?: number;

  @Column({ type: "bytea", nullable: true }) // ✅ เก็บเป็น binary (Base64)
  ac_image_data!: Buffer;

  @Column({ type: "timestamp", nullable: false }) // ✅ ต้องเป็น timestamp
  ac_normal_register!: Date;

  @Column({ type: "timestamp", nullable: true }) // ✅ ต้องเป็น timestamp
  ac_start_assesment?: Date;

  @Column({ type: "timestamp", nullable: true }) // ✅ ต้องเป็น timestamp
  ac_end_assesment?: Date;

  @ManyToOne(() => Assessment, (assessment) => assessment.activities, {
    nullable: true,
    onDelete: "SET NULL",
  })
  assessment!: Assessment | null;
}
