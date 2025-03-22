import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Assessment } from "./Assessment"; // Import Entity ของ Assessment ที่สร้างไว้

@Entity("activity")
export class Activity {
  @PrimaryGeneratedColumn()
  ac_id!: number;

  @Column({ type: "varchar", length: 255 })
  ac_name?: string;

  @Column({ type: "varchar", length: 255 })
  ac_company_lecturer?: string;

  @Column({ type: "varchar", length: 255 })
  ac_description?: string;

  @Column({ type: "varchar", length: 100 })
  ac_type?: string;

  @Column({ type: "varchar", length: 100 })
  ac_room?: string;

  @Column({ type: "int" })
  ac_seat?: number;

  @Column({ type: "text" })
  ac_food?: string;

  @Column({ type: "varchar", length: 50 })
  ac_status?: string;

  @Column({ type: "timestamp", nullable: true })
  ac_start_register?: Date;

  @Column({ type: "timestamp", nullable: true })
  ac_end_register?: Date;

  @Column({ type: "timestamp", nullable: true })
  ac_create_date?: Date;

  @Column({ type: "timestamp", nullable: true })
  ac_last_update?: Date;

  @Column({ type: "int", nullable: true })
  ac_registered_count?: number;

  @Column({ type: "int", nullable: true })
  ac_attended_count?: number;

  @Column({ type: "int", nullable: true })
  ac_not_attended_count?: number;

  @Column({ type: "timestamp", nullable: true })
  ac_start_time?: Date;

  @Column({ type: "timestamp", nullable: true })
  ac_end_time?: Date;

  @Column({ type: "timestamp", nullable: true })
  ac_normal_register?: Date;

  @Column({ type: "varchar", length: 10, nullable: true })
  ac_location_type?: string;

  @Column({ type: "varchar", length: 20, nullable: true })
  ac_state?: string;

  @Column({ type: "int", nullable: true })
  ac_recieve_hours?: number;

  @ManyToOne(() => Assessment, (assessment) => assessment.as_id, {
    nullable: true,
  })
  @JoinColumn({ name: "assessment_id" })
  assessment?: Assessment;

  @Column({ type: "int", nullable: true })
  assessment_id?: number; // เพิ่มการรับค่า assessment_id

  @Column({ type: "timestamp", nullable: true })
  ac_start_assessment?: Date;

  @Column({ type: "timestamp", nullable: true })
  ac_end_assessment?: Date;

  @Column({ type: "varchar", length: 255, nullable: true })
  ac_image_url?: string;
}
