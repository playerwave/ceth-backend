import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { SetNumber } from "./setNumbers.entity";
import { Choice } from "./choice.entity";
import { Answer } from "./answer.entity";
@Entity()
export class Question {
  @PrimaryGeneratedColumn()
  question_id!: number;

  @Column({ type: "text" })
  question_text!: string;

  @Column({ type: "int" })
  question_number?: number;

  @ManyToOne(() => SetNumber, (setNumber) => setNumber.question)
  @JoinColumn({ name: "set_number_id" })
  setNumber?: SetNumber;

  @Column()
  set_number_id?: number;

  @Column({
    type: "enum",
    enum: [
      "Fix Single answer",
      "Single answer",
      "Multiple answer",
      "Text answer",
    ],
    default: "Text answer",
  })
  question_type?:
    | "Fix Single answer"
    | "Single answer"
    | "Multiple answer"
    | "Text answer";

  @OneToMany(() => Choice, (choice) => choice.question)
  choice?: Choice[];

  @OneToMany(() => Answer, (answer) => answer.question)
  answer?: Answer[];
}
