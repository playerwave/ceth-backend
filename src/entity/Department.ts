import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Unique,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { EventCoop } from "./EventCoop";
import { Students } from "./Students";
import { Faculty } from "./Faculty";

@Entity()
@Unique(["department_name"])
export class Department {
  @PrimaryGeneratedColumn()
  department_id!: number;

  @Column({ type: "varchar", length: 255 })
  department_name?: string;

  @OneToMany(() => EventCoop, (eventCoop) => eventCoop.department)
  eventCoops?: EventCoop[];

  @OneToMany(() => Students, (students) => students.users)
  students!: Students[];

  @ManyToOne(() => Faculty, (faculty) => faculty.department)
  @JoinColumn({ name: 'faculty_id' })
  faculty!: Faculty;
}
