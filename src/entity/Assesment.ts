import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { Activity } from "./Activity";

@Entity("assessment")
export class Assessment {
  @PrimaryGeneratedColumn()
  as_id!: number;

  @Column({ type: "int", nullable: false })
  q_id!: number;

  @Column({ type: "varchar", length: 255, nullable: false })
  as_name!: string;

  @Column({ type: "varchar", length: 100, nullable: false })
  as_type!: string;

  @Column({ type: "text", nullable: false })
  as_description!: string;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  as_create_date!: Date;

  @Column({ type: "timestamp", nullable: true, onUpdate: "CURRENT_TIMESTAMP" })
  as_last_update?: Date;

  // Many-to-Many Relationship กับ Activity
  @ManyToMany(() => Activity, (activity) => activity.assessments)
  activities!: Activity[];
}
