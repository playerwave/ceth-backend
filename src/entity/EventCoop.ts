import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Department } from "./Department";
import { Grade } from "./Grade";

@Entity("eventcoop")
export class EventCoop {
  @PrimaryGeneratedColumn()
  eventcoop_id!: number;

  @ManyToOne(() => Department, (department) => department.eventcoops)
  @JoinColumn({ name: "department_id" })
  department!: Department;

  @ManyToOne(() => Grade, (grade) => grade.eventcoops)
  @JoinColumn({ name: "grade_id" })
  grade!: Grade;

  @Column({ type: "timestamp" })
  date!: Date;
}
