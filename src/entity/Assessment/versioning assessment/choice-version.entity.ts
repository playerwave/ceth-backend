import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from "typeorm";
import { QuestionVersion } from "./question-version.entity";
import { Answer } from "../answer.entity";

@Entity()
@Index("IDX_CHOICE_VERSION_QUESTION_VERSION_ID", ["question_version_id"])
@Index("IDX_CHOICE_VERSION_ORDER_INDEX", ["order_index"])
export class ChoiceVersion {
  @PrimaryGeneratedColumn()
  choice_version_id!: number;

  @ManyToOne(() => QuestionVersion, (question) => question.choices)
  @JoinColumn({ name: "question_version_id" })
  question!: QuestionVersion;

  @Column({ type: "int" })
  question_version_id!: number;

  @Column({ type: "int" })
  order_index!: number;

  @Column({ type: "text" })
  choice_text!: string;

  @OneToMany(() => Answer, (answer) => answer.choiceVersion)
  answers?: Answer[];
}
