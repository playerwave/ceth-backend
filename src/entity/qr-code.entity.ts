import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { Activity } from "./activity.entity";

@Entity()
@Index("IDX_QR_CODE_TOKEN", ["token"])
@Index("IDX_QR_CODE_ACTIVITY", ["activity_id"])
@Index("IDX_QR_CODE_EXPIRES_AT", ["expires_at"])
export class QRCode {
  @PrimaryGeneratedColumn()
  qr_code_id!: number;

  @Column({ type: "varchar", length: 255, unique: true })
  token!: string;

  @Column({ type: "int" })
  activity_id!: number;

  @ManyToOne(() => Activity, (activity) => activity.qrCodes)
  @JoinColumn({ name: "activity_id" })
  activity?: Activity;

  @Column({ type: "timestamp" })
  expires_at!: Date;

  @Column({ type: "boolean", default: true })
  is_active!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
