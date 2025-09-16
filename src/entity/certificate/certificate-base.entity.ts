import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
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

  @Column({ type: "varchar", length: 255, nullable: true })
  supervisor_name1?: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  supervisor_name2?: string | null;

  @Column({ type: "timestamp", nullable: true })
  claim_expiration_date?: Date | null;
}
