
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Join } from "./Join";
import { SetNumber } from "./SetNumber";

@Entity("assessment")
export class Assessment {
  @PrimaryGeneratedColumn()
  assessment_id!: number;

  @ManyToOne(() => Join, (join) => join.assessments, { nullable: false })
  @JoinColumn({ name: "join_id" })
  join!: Join;

  @Column({ type: "varchar", length: 255 })
  assessment_name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "timestamp" })
  create_date!: Date;

  @Column({ type: "timestamp" })
  last_update!: Date;

  @Column({ type: "varchar", length: 20 })
  assessment_status: "Not finished" | "Finished" | "Unsuccessful" = "Not finished";

  @ManyToOne(() => SetNumber, (setNumber) => setNumber.assessments, { nullable: false })
  @JoinColumn({ name: "set_number_id" })
  set_number!: SetNumber;

  @Column({ type: "varchar", length: 10, default: "Active" })
  status: "Active" | "Inactive" = "Active";
}
