import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Students } from "../students.entity";
import { Teacher } from "../teacher.entity";
import { Activity } from "../activity.entity";

import { Transform } from "class-transformer";
import { parseISO } from "date-fns";
import { format } from "date-fns-tz";

@Entity()
@Index("IDX_STUDENTS_ID_CERTIFICATE", ["students_id"])
@Index("IDX_TEACHER_ID_CERTIFICATE", ["teacher_id"])
@Index("IDX_ACTIVITY_ID_CERTIFICATE", ["activity_id"])
@Index("IDX_DATE_CERTIFICATE", ["date"])
@Index("IDX_HOURS_CERTIFICATE", ["hours"])
@Index("IDX_IMG_CERTIFICATE", ["img"])
@Index("IDX_STATUS_CERTIFICATE", ["status"])
@Index("IDX_UPLOADED_AT", ["uploaded_at"])
export class Certificate {
  @PrimaryGeneratedColumn()
  certificate_id!: number;

  @ManyToOne(() => Students, (students) => students.certificate)
  @JoinColumn({ name: "students_id" })
  students!: Students;

  @Column({ type: "int" })
  students_id!: number;

  @ManyToOne(() => Teacher, (teacher) => teacher.certificate)
  @JoinColumn({ name: "teacher_id" })
  teacher?: Teacher;

  @Column({ type: "int" })
  teacher_id?: number;

  @ManyToOne(() => Activity, (activity) => activity.certificate)
  @JoinColumn({ name: "activity_id" })
  activity?: Activity;

  @Column({ type: "int" })
  activity_id?: number;

  @Column({ type: "timestamp" })
  @Transform(({ value }) =>
    value
      ? format(parseISO(value), "yyyy-MM-dd HH:mm:ss", {
          timeZone: "Asia/Bangkok",
        })
      : null
  )
  date?: Date;

  @Column({ type: "int" })
  hours?: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  img?: string | null;

  @Column({
    type: "enum",
    enum: ["Pending", "Pass", "Fail"],
    default: "Pending",
  })
  status?: "Pending" | "Pass" | "Fail";

  // ✅ เพิ่มฟิลด์ใหม่สำหรับระบบตรวจสอบ
  @Column({ type: "varchar", length: 500, nullable: true })
  original_filename?: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  file_type?: string; // "image/jpeg", "image/png", "application/pdf"

  @Column({ type: "bigint", nullable: true })
  file_size?: number; // bytes

  @Column({ type: "json", nullable: true })
  ocr_extracted_data?: {
    studentName: string;
    courseName: string;
    completionDate: string;
    certificateId: string;
    issuerName: string;
  };

  @Column({ type: "json", nullable: true })
  verification_metadata?: {
    lastVerified: Date;
    verificationCount: number;
    confidenceScore: number;
    verificationStatus: string;
  };

  @CreateDateColumn({ type: "timestamp" })
  uploaded_at!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updated_at!: Date;
}
