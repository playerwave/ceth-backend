import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { Users } from "./users.entity";
import { EventCoop } from "./eventcoop.entity";
import { Grade } from "./grade.entity";
import { Department } from "./department.entity";
import { Faculty } from "./faculty.entity";
import { Join } from "./join.entity";
import { Certificate } from "./certificate.entity";

@Entity()
export class Students {
  @PrimaryGeneratedColumn()
  students_id!: number;

  @ManyToOne(() => Users, (users) => users.students)
  @JoinColumn({ name: "users_id" })
  users!: Users;

  @Column({ type: "int" })
  users_id!: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  first_name?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  last_name?: string;

  @Column({ type: "varchar", length: 255, unique: true, nullable: true })
  email?: string;

  @Column({ type: "int", nullable: true })
  soft_hours?: number;

  @Column({ type: "int", nullable: true })
  hard_hours?: number;

  @Column({ type: "enum", enum: ["Normal", "Risk"], nullable: true })
  risk_status?: "Normal" | "Risk";

  @Column({ type: "enum", enum: ["Studying", "Graduate"], nullable: true })
  education_status?: "Studying" | "Graduate";

  @ManyToOne(() => Faculty, (faculty) => faculty.students)
  @JoinColumn({ name: "faculty_id" })
  faculty!: Faculty;

  @Column({ type: "int",nullable: true })
  faculty_id?: number;

  @ManyToOne(() => Department, (department) => department.students)
  @JoinColumn({ name: "department_id" })
  department!: Department;

  @Column({ type: "int",nullable: true })
  department_id?: number;

  @ManyToOne(() => Grade, (grade) => grade.students)
  @JoinColumn({ name: "grade_id" })
  grade!: Grade;

  @Column({ type: "int", nullable: true })
  grade_id?: number;

  @ManyToOne(() => EventCoop, (eventCoop) => eventCoop.students)
  @JoinColumn({ name: "eventcoop_id" })
  eventCoop!: EventCoop;

  @Column({ type: "int", nullable: true })
  eventcoop_id?: number;

  @OneToMany(() => Join, (join) => join.students)
  join?: Join[];

  @OneToMany(() => Certificate, (certificate) => certificate.students)
  certificate?: Certificate[];
}
