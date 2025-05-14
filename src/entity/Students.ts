import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { Users } from "./Users";
import { EventCoop } from "./EventCoop";
import { Grade } from "./Grade";
import { Department } from "./Department";
import { Faculty } from "./Faculty";

@Entity()
export class Students {
  @PrimaryGeneratedColumn()
  students_id!: number;

  @ManyToOne(() => Users, (users) => users.students)
  users!: Users;

  @Column({ type: "varchar", length: 255 })
  first_name?: string;

  @Column({ type: "varchar", length: 255 })
  last_name?: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email?: string;

  @Column({ type: "int" })
  soft_hours?: number;

  @Column({ type: "int" })
  hard_hours?: number;

  @ManyToOne(() => Faculty, (faculty) => faculty.students)
  faculty?: Faculty;

  @ManyToOne(() => Department, (department) => department.students)
  department?: Department;

  @ManyToOne(() => Grade, (grade) => grade.students)
  grade?: Grade;

  @ManyToOne(() => EventCoop, (eventCoop) => eventCoop.students)
  eventCoop?: EventCoop;
}
