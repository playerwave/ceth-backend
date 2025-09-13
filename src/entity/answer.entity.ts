import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Join } from "./join.entity";
import { Question } from "./question.entity";
import { Choice } from "./choice.entity";
import { SetNumber } from "./setNumbers.entity";
import { Assessment } from "./assessment.entity";

@Entity()
export class Answer {
  @PrimaryGeneratedColumn()
  answer_id!: number;

  @ManyToOne(() => Join, (join) => join.answer)
  @JoinColumn({ name: "join_id" })
  join?: Join;

  @Column({ type: "int" })
  join_id?: number;

  @ManyToOne(() => Question, (question) => question.answer)
  @JoinColumn({ name: "question_id" })
  question?: Question;

  @Column({ type: "int" })
  question_id?: number;

  @ManyToOne(() => Choice, (choice) => choice.answer, { nullable: true })
  @JoinColumn({ name: "choice_id" })
  choice?: Choice | null;

  @Column({ type: "int", nullable: true })
  choice_id?: number | null;

  @Column({ type: "text", nullable: true })
  answer_text?: string | null;

  @ManyToOne(() => SetNumber, (setNumber) => setNumber.answer)
  @JoinColumn({ name: "set_number_id" })
  setNumber!: SetNumber;

  @Column({ type: "int" })
  set_number_id?: number;

  @ManyToOne(() => Assessment, (assessment) => assessment.answer)
  @JoinColumn({ name: "assessment_id" })
  assessment?: Assessment;

  @Column({ type: "int" })
  assessment_id?: number;
}
