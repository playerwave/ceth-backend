import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from "typeorm";
import { AssessmentVersion } from "./assessment-version.entity";
import { QuestionVersion } from "./question-version.entity";
import { Answer } from "../answer.entity";

@Entity()
@Index("IDX_SET_NUMBER_VERSION_ASSESSMENT_VERSION_ID", ["assessment_version_id"])
@Index("IDX_SET_NUMBER_VERSION_ORDER_INDEX", ["order_index"])
export class SetNumberVersion {
  @PrimaryGeneratedColumn()
  set_number_version_id!: number;

  @ManyToOne(() => AssessmentVersion, (version) => version.setNumbers)
  @JoinColumn({ name: "assessment_version_id" })
  assessmentVersion!: AssessmentVersion;

  @Column({ type: "int" })
  assessment_version_id!: number;

  @Column({ type: "int" })
  order_index!: number;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "timestamp" })
  created_at!: Date;

  @OneToMany(() => QuestionVersion, (question) => question.setNumber)
  questions?: QuestionVersion[];

  @OneToMany(() => Answer, (answer) => answer.setNumberVersion)
  answers?: Answer[];
}
