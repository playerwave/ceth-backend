import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Question } from "./Question"; // Import Entity ของ Question ที่สร้างไว้

@Entity("choice")
export class Choice {
  @PrimaryGeneratedColumn()
  ch_id!: number;

  @ManyToOne(() => Question, (question) => question.q_id)
  @JoinColumn({ name: "q_id" })
  question!: Question;

  @Column({ type: "text" })
  ch_text?: string;
}
