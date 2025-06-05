import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Faculty } from "./Faculty";
import { Department } from "./Department";
import { Grade } from "./Grade";
import { EventCoop } from "./EventCoop";

@Entity("students")
export class Students {
  @PrimaryGeneratedColumn()
  students_id!: number;

  @Column({ type: "varchar", length: 255 })
  first_name!: string;

  @Column({ type: "varchar", length: 255 })
  last_name!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({ type: "varchar", length: 10 })
  risk_status!: "Normal" | "Risk";

  @Column({ type: "varchar", length: 20 })
  education_status!: "Studying" | "Graduate";

  @Column({ type: "int" })
  soft_hours!: number;

  @Column({ type: "int" })
  hard_hours!: number;

  @ManyToOne(() => Faculty, (faculty) => faculty.students)
  @JoinColumn({ name: "faculty_id" })
  faculty!: Faculty;

  @ManyToOne(() => Department, (department) => department.students)
  @JoinColumn({ name: "department_id" })
  department!: Department;

  @ManyToOne(() => Grade, (grade) => grade.students)
  @JoinColumn({ name: "grade_id" })
  grade!: Grade;

  @ManyToOne(() => EventCoop, (eventCoop) => eventCoop.students)
  @JoinColumn({ name: "eventcoop_id" })
  eventcoop!: EventCoop;
}
