import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Activity } from "./Activity";

@Entity("assessment")
export class Assessment {
  @PrimaryGeneratedColumn()
  as_id!: number;

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

  // ✅ เปลี่ยนจาก ManyToMany เป็น OneToMany
  @OneToMany(() => Activity, (activity) => activity.assessment_id)
  activities!: Activity[];
}
