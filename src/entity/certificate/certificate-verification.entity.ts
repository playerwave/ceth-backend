import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from "typeorm";
import { Certificate } from "./certificate.entity";
import { CertificateTemplate } from "./certificate-template.entity";

@Entity()
@Index("IDX_CERTIFICATE_ID_VERIFICATION", ["certificate_id"])
@Index("IDX_TEMPLATE_ID_VERIFICATION", ["template_id"])
@Index("IDX_VERIFIED_AT", ["verified_at"])
export class CertificateVerification {
  @PrimaryGeneratedColumn()
  verification_id!: number;

  @ManyToOne(() => Certificate)
  @JoinColumn({ name: "certificate_id" })
  certificate!: Certificate;

  @Column({ type: "int" })
  certificate_id!: number;

  @ManyToOne(() => CertificateTemplate)
  @JoinColumn({ name: "template_id" })
  template?: CertificateTemplate;

  @Column({ type: "int", nullable: true })
  template_id?: number;

  // Verification Results
  @Column({ type: "json" })
  verification_results!: {
    isAuthentic: boolean;
    confidenceScore: number; // 0-100
    matchedFeatures: string[];
    failedFeatures: string[];
    recommendations: string[];
  };

  // Detailed Analysis
  @Column({ type: "json" })
  visual_analysis!: {
    backgroundMatch: number; // 0-100
    logoMatch: number;
    watermarkMatch: number;
    signatureMatch: number;
    layoutMatch: number;
  };

  @Column({ type: "json" })
  content_analysis!: {
    fieldCompleteness: number; // 0-100
    formatConsistency: number;
    dataValidity: number;
    textQuality: number;
  };

  @Column({ type: "json" })
  security_analysis!: {
    qrCodeValid: boolean;
    securityElementsPresent: string[];
    securityElementsMissing: string[];
    tamperingDetected: boolean;
  };

  @Column({ type: "varchar", length: 50 })
  verification_method!: string; // "OCR", "Template", "Hybrid"

  @CreateDateColumn({ type: "timestamp" })
  verified_at!: Date;
}


