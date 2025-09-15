import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from "typeorm";
import { SetNumberVersion } from "./setNumber-version.entity";
import { ChoiceVersion } from "./choice-version.entity";
import { Answer } from "../answer.entity";

@Entity()
@Index("IDX_QUESTION_VERSION_SET_NUMBER_VERSION_ID", ["set_number_version_id"])
@Index("IDX_QUESTION_VERSION_ORDER_INDEX", ["order_index"])
export class QuestionVersion {
  @PrimaryGeneratedColumn()
  question_version_id!: number;

  @ManyToOne(() => SetNumberVersion, (setNumber) => setNumber.questions)
  @JoinColumn({ name: "set_number_version_id" })
  setNumber!: SetNumberVersion;

  @Column({ type: "int" })
  set_number_version_id!: number;

  @Column({ type: "int" })
  order_index!: number;

  @Column({ type: "text" })
  question_text!: string;

  @Column({
    type: "enum",
    enum: ["single_choice", "multi_choice", "text", "rating"],
    default: "text"
  })
  question_type!: "single_choice" | "multi_choice" | "text" | "rating";

  @OneToMany(() => ChoiceVersion, (choice) => choice.question)
  choices?: ChoiceVersion[];

  @OneToMany(() => Answer, (answer) => answer.questionVersion)
  answers?: Answer[];
}
