import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Unique,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { EventCoop } from "./eventcoop.entity";
import { Students } from "./students.entity";
import { Faculty } from "./faculty.entity";

@Entity()
export class Department {
  @PrimaryGeneratedColumn()
  department_id!: number;

  @Column({ type: "varchar", length: 255, unique: true })
  department_name?: string;

  @OneToMany(() => EventCoop, (eventCoop) => eventCoop.department)
  eventCoop?: EventCoop[];

  @OneToMany(() => Students, (students) => students.department)
  students?: Students[];

  @ManyToOne(() => Faculty, (faculty) => faculty.department)
  @JoinColumn({ name: 'faculty_id' })
  faculty!: Faculty;

  @Column({ type: "int", nullable: true })
  faculty_id?: number | null;
}