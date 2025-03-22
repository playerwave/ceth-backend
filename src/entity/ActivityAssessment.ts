import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from "typeorm";
import { Activity } from "./Activity"; // Import Entity ของ Activity ที่สร้างไว้
import { Assessment } from "./Assessment"; // Import Entity ของ Assessment ที่สร้างไว้

@Entity("activityassessment")
export class ActivityAssessment {
  @PrimaryColumn()
  ac_id!: number;

  @PrimaryColumn()
  as_id!: number;

  @ManyToOne(() => Activity, (activity) => activity.ac_id, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "ac_id" })
  activity?: Activity;

  @ManyToOne(() => Assessment, (assessment) => assessment.as_id, {
    onUpdate: "NO ACTION",
    onDelete: "NO ACTION",
  })
  @JoinColumn({ name: "as_id" })
  assessment?: Assessment;
}
