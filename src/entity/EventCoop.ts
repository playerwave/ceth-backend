import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { Department } from "./Department";
import { Grade } from "./Grade";
import { Students } from "./Students";

@Entity()
export class EventCoop {
  @PrimaryGeneratedColumn()
  eventcoop_id!: number;

  @ManyToOne(() => Department, (department) => department.eventCoops)
  department?: Department;

  @ManyToOne(() => Grade, (grade) => grade.eventCoops)
  grade?: Grade;

  @Column({ type: "timestamp" })
  date?: Date;

  @OneToMany(() => Students, (students) => students.users)
  students!: Students[];
}
