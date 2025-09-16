import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from "typeorm";
import { Assessment } from "../assessment.entity";
import { SetNumberVersion } from "./setNumber-version.entity";
import { Activity } from "../../activity.entity";
import { Answer } from "../answer.entity";

@Entity()
@Index("IDX_ASSESSMENT_VERSION_ASSESSMENT_ID", ["assessment_id"])
@Index("IDX_ASSESSMENT_VERSION_VERSION_NO", ["version_no"])
@Index("IDX_ASSESSMENT_VERSION_PUBLISHED", ["is_published"])
@Index("IDX_ASSESSMENT_VERSION_CREATED_AT", ["created_at"])
export class AssessmentVersion {
  @PrimaryGeneratedColumn()
  assessment_version_id!: number;

  @ManyToOne(() => Assessment, (assessment) => assessment.versions)
  @JoinColumn({ name: "assessment_id" })
  assessment!: Assessment;

  @Column({ type: "int" })
  assessment_id!: number;

  @Column({ type: "int" })
  version_no!: number;

  @Column({ type: "boolean", default: false })
  is_published!: boolean;

  @Column({ type: "timestamp", nullable: true })
  published_at?: Date | null;

  @Column({ type: "timestamp" })
  created_at!: Date;

  @OneToMany(() => SetNumberVersion, (setNumber) => setNumber.assessmentVersion)
  setNumbers?: SetNumberVersion[];

  @OneToMany(() => Activity, (activity) => activity.assessmentVersion)
  activities?: Activity[];

  @OneToMany(() => Answer, (answer) => answer.assessmentVersion)
  answers?: Answer[];
}
