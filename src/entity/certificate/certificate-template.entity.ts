import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity()
@Index("IDX_TEMPLATE_NAME", ["template_name"])
@Index("IDX_ISSUER_ORGANIZATION", ["issuer_organization"])
@Index("IDX_CERTIFICATE_TYPE", ["certificate_type"])
export class CertificateTemplate {
  @PrimaryGeneratedColumn()
  template_id!: number;

  @Column({ type: "varchar", length: 255 })
  template_name!: string; // "THAI MOOC Certificate"

  @Column({ type: "varchar", length: 500 })
  template_description!: string;

  @Column({ type: "varchar", length: 255 })
  issuer_organization!: string; // "Srinakharinwirot University"

  @Column({ type: "varchar", length: 255 })
  certificate_type!: string; // "Online Course", "Workshop", etc.

  // Visual Features
  @Column({ type: "json" })
  visual_features!: {
    backgroundColor: string;
    logoPosition: { x: number; y: number };
    watermarkPattern: string;
    signatureArea: { x: number; y: number; width: number; height: number };
  };

  // Content Structure
  @Column({ type: "json" })
  content_structure!: {
    expectedFields: string[];
    fieldPositions: { [key: string]: { x: number; y: number } };
    fontFamilies: string[];
    textColors: string[];
  };

  // Security Features
  @Column({ type: "json" })
  security_features!: {
    qrCodePosition: { x: number; y: number };
    securityElements: string[];
    hasWatermark: boolean;
    hasSignature: boolean;
  };

  // Template Image
  @Column({ type: "varchar", length: 500 })
  template_image_url!: string;

  @Column({ type: "boolean", default: true })
  is_active!: boolean;

  @CreateDateColumn({ type: "timestamp" })
  created_at!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updated_at!: Date;
}


