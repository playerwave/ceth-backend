import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Question } from "./Question";
import { Choice } from "./Choice";

@Entity("question_choice")
export class QuestionChoice {
  @PrimaryGeneratedColumn()
  question_choice_id!: number;

  @ManyToOne(() => Question, (question) => question.question_choices, {
    nullable: false,
  })
  @JoinColumn({ name: "question_id" })
  question!: Question;

  @ManyToOne(() => Choice, (choice) => choice.question_choices, {
    nullable: false,
  })
  @JoinColumn({ name: "choice_id" })
  choice!: Choice;

  @ManyToOne(() => SetNumber, (setNumber) => setNumber.question_choices, {
    nullable: false,
  })
  @JoinColumn({ name: "set_number_id" })
  set_number!: SetNumber;
}
