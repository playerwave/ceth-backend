import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

@Entity("certificate")
export class Certificate {
  @PrimaryGeneratedColumn()
  c_id!: number;

  @ManyToOne(() => User, (user) => user.certificates)
  @JoinColumn({ name: "u_id" })
  user!: User;

  @Column({ type: "varchar", length: 255, nullable: true })
  c_name?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  c_type?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  c_img?: string;

  @Column({ type: "int", nullable: true })
  c_earned_hours?: number;

  @Column({ type: "varchar", length: 50, nullable: true })
  c_status?: string;
}
