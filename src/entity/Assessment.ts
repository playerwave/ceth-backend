import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Question } from "./Question"; // Import Entity ของ Question ที่สร้างไว้

@Entity("assessment")
export class Assessment {
  @PrimaryGeneratedColumn()
  as_id!: number;

  @ManyToOne(() => Question, (question) => question.q_id)
  @JoinColumn({ name: "q_id" })
  q_id!: Question;

  @Column({ type: "varchar", length: 255 })
  as_name?: string;

  @Column({ type: "varchar", length: 100 })
  as_type?: string;

  @Column({ type: "varchar", length: 255 })
  as_description?: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  as_create_date?: Date;

  @Column({ type: "timestamp", nullable: true })
  as_last_update?: Date;
}
