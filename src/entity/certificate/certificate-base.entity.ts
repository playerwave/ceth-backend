import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Activity } from "../activity.entity";

@Entity()
export class CertificateBase {
  @PrimaryGeneratedColumn()
  certificate_base_id!: number;

  @ManyToOne(() => Activity)
  @JoinColumn({ name: "activity_id" })
  activity?: Activity;

  @Column({ type: "int" })
  activity_id!: number;

  @Column({ type: "varchar", length: 255 })
  certificate_name!: string;

  @Column({ type: "varchar", length: 255 })
  certificate_source!: string;

  @Column({ type: "varchar", nullable: true })
  certificate_type!: "THAI MOOC" | "BUU MOOC" | "Other";

  @Column({ type: "timestamp", nullable: true })
  get_certificate_date?: Date | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  organize_base_name?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  supervisor_name1?: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  supervisor_name2?: string | null;

  // ✅ เพิ่มฟิลด์ใหม่สำหรับระบบตรวจสอบ
  @Column({ type: "varchar", length: 500, nullable: true })
  template_image_url?: string;

  @Column({ type: "json", nullable: true })
  validation_rules?: {
    requiredFields: string[];
    fieldFormats: { [key: string]: string };
    securityFeatures: string[];
  };

  // ✅ เพิ่มฟิลด์สำหรับ Certificate Template (Course activities)
  @Column({ type: "json", nullable: true })
  ocr_data?: {
    // ✅ ข้อมูลที่เก็บจริงจาก OCR
    natural_text?: string;
    extracted_fields?: {
      natural_text?: string;
    };
    processing_time?: number;
    total_pages?: number;
    raw_response?: Record<string, unknown>;
    // ✅ ข้อมูลที่คาดหวังสำหรับการเปรียบเทียบ
    student_name?: string;
    course_name?: string;
    instructor_name?: string;
    university_name?: string;
    completion_date?: string;
    certificate_id?: string;
    raw_text?: string;
  } | null;

  @Column({ type: "json", nullable: true })
  image_analysis?: {
    dominantColors?: {
      dominant: string;
      palette: string[];
    };
    logoPosition?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    watermark?: {
      detected: boolean;
      confidence: number;
    };
    signature?: {
      detected: boolean;
      confidence: number;
    };
    layout?: {
      width: number;
      height: number;
      textRegions: number;
      imageRegions: number;
      emptySpaceRatio: number;
    };
  } | null;

  @Column({ type: "text", nullable: true })
  description?: string | null;

  @Column({ type: "boolean", default: true })
  is_active!: boolean;

  @CreateDateColumn({ type: "timestamp" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updated_at!: Date;
}
