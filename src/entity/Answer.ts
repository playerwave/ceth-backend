import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Join } from "./Join"; // Import Join entity
import { Question } from "./Question"; // Import Question entity
import { Choice } from "./Choice"; // Import Choice entity

@Entity("answer")
export class Answer {
  @PrimaryGeneratedColumn()
  choose_id!: number;

  @ManyToOne(() => Join, (join) => join.answers, { nullable: false })
  @JoinColumn({ name: "join_id" })
  join!: Join;

  @ManyToOne(() => Question, (question) => question.answers, { nullable: false })
  @JoinColumn({ name: "question_id" })
  question!: Question;

  @ManyToOne(() => Choice, (choice) => choice.answers, { nullable: false })
  @JoinColumn({ name: "choice_id" })
  choice!: Choice;

  @Column("text", { nullable: true })
  answer_text?: string; // The actual answer provided by the user

  @ManyToOne(() => SetNumber, (setNumber) => setNumber.answers, { nullable: true })
  @JoinColumn({ name: "set_number_id" })
  set_number?: SetNumber;

  @ManyToOne(() => Assessment, (assessment) => assessment.answers, { nullable: true })
  @JoinColumn({ name: "assessment_id" })
  assessment?: Assessment;
}
