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

@Entity()
@Index("IDX_CERTIFICATE_ID_AUDIT", ["certificate_id"])
@Index("IDX_ACTION_AUDIT", ["action"])
@Index("IDX_PERFORMED_AT", ["performed_at"])
@Index("IDX_PERFORMED_BY", ["performed_by"])
export class CertificateAudit {
  @PrimaryGeneratedColumn()
  audit_id!: number;

  @ManyToOne(() => Certificate)
  @JoinColumn({ name: "certificate_id" })
  certificate!: Certificate;

  @Column({ type: "int" })
  certificate_id!: number;

  @Column({ type: "varchar", length: 50 })
  action!: string; // "UPLOAD", "VERIFY", "APPROVE", "REJECT", "UPDATE"

  @Column({ type: "json", nullable: true })
  old_values?: any;

  @Column({ type: "json", nullable: true })
  new_values?: any;

  @Column({ type: "varchar", length: 255, nullable: true })
  reason?: string;

  @Column({ type: "varchar", length: 100 })
  performed_by!: string; // user_id หรือ system

  @CreateDateColumn({ type: "timestamp" })
  performed_at!: Date;
}


