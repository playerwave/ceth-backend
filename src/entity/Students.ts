import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn
} from "typeorm";
import { Users } from "./Users";
import { EventCoop } from "./EventCoop";
import { Grade } from "./Grade";
import { Department } from "./Department";
import { Faculty } from "./Faculty";
import { Join } from "./Join";
import { Certificate } from './Certificate'
@Entity()
export class Students {
  @PrimaryGeneratedColumn()
  students_id!: number;

  @ManyToOne(() => Users, (users) => users.students)
  @JoinColumn({ name: 'users_id' })
  users!: Users

  @Column()
  users_id!: number;

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

  @Column({ type: 'enum', enum: ['Normal', 'Risk'] })
  risk_status?: 'Normal' | 'Risk';

  @Column({ type: 'enum', enum: ['Studying', 'Graduate'] })
  education_status?: 'Studying' | 'Graduate';

  @ManyToOne(() => Faculty, (faculty) => faculty.students)
  @JoinColumn({ name: 'faculty_id' })
  faculty!: Faculty;

  @Column()
  faculty_id!: number;

  @ManyToOne(() => Department, (department) => department.students)
  @JoinColumn({ name: 'department_id' })
  department!: Department;

  @Column()
  department_id!: number;

  @ManyToOne(() => Grade, (grade) => grade.students)
  @JoinColumn({ name: 'grade_id' })
  grade!: Grade;

  @Column()
  grade_id!: number;

  @ManyToOne(() => EventCoop, (eventCoop) => eventCoop.students)
  @JoinColumn({ name: 'eventcoop_id' })
  eventCoop!: EventCoop;

  @Column()
  eventcoop_id!: number;

  @OneToMany(() => Join, (join) => join.students)
  join?: Join[];

  @OneToMany(() => Certificate, (certificate) => certificate.students)
  certificate?: Certificate[];
}
