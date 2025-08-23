import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  ManyToOne,
  OneToMany,
  JoinColumn
} from "typeorm";
import { Roles } from "./roles.entity";
import { Students } from "./students.entity";
import { Teacher } from "./teacher.entity";

@Entity()
export class Users {
  @PrimaryGeneratedColumn()
  users_id!: number;

  @Column({ type: "varchar", length: 255, unique: true })
  username?: string;

  @Column({ type: "varchar", length: 255 })
  password?: string;


  @ManyToOne(() => Roles)
  @JoinColumn({ name: 'roles_id' })
  roles!: Roles;

  @Column({ type: "int" })
  roles_id!: number;

  @OneToMany(() => Students, (students) => students.users)
  students!: Students[];

  @OneToMany(() => Teacher, (teacher) => teacher.users)
  teacher!: Teacher[];
}