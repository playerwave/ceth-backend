import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Users } from "./users.entity";
import { Faculty } from "./faculty.entity";

@Entity()
export class Teacher {
  @PrimaryGeneratedColumn()
  teacher_id!: number;

  @ManyToOne(() => Users, (users) => users.teacher)
  @JoinColumn({ name: "users_id" })
  users!: Users;

  @Column({ type: "int" })
  users_id!: number;

  @Column({ type: "varchar", length: 255 })
  first_name?: string;

  @Column({ type: "varchar", length: 255 })
  last_name?: string;

  @ManyToOne(() => Faculty, (faculty) => faculty.teacher)
  @JoinColumn({ name: "faculty_id" })
  faculty!: Faculty;

  @Column({ type: "int" })
  faculty_id!: number;
}
