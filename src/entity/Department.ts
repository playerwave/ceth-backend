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

  @Column()
  faculty_id!: number;
}
