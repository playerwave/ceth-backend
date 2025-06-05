import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { QuestionType } from "./QuestionType";
import { SetNumber } from "./SetNumber";

@Entity("question")
export class Question {
  @PrimaryGeneratedColumn()
  question_id!: number;

  @Column("text")
  question_text!: string;

  @ManyToOne(() => QuestionType, (questionType) => questionType.questions, {
    nullable: false,
  })
  @JoinColumn({ name: "question_type_id" })
  question_type!: QuestionType;

  @Column({ type: "int", nullable: false })
  question_number!: number;

  @ManyToOne(() => SetNumber, (setNumber) => setNumber.questions, {
    nullable: false,
  })
  @JoinColumn({ name: "set_number_id" })
  set_number!: SetNumber;
}
