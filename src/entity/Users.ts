import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  ManyToOne,
  OneToMany,
  JoinColumn
} from "typeorm";
import { Roles } from "./Roles";
import { Students } from "./Students";
import { Teacher } from "./Teacher";

@Entity()
@Unique(["username"])
export class Users {
  @PrimaryGeneratedColumn()
  users_id!: number;

  @Column({ type: "varchar", length: 255 })
  username?: string;

  @Column({ type: "varchar", length: 255 })
  password?: string;


  @ManyToOne(() => Roles)
  @JoinColumn({ name: 'roles_id' })
  roles!: Roles;

  @Column()
  roles_id!: number;

  @OneToMany(() => Students, (students) => students.users)
  students!: Students[];

  @OneToMany(() => Teacher, (teacher) => teacher.users)
  teacher!: Teacher[];
}
