import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
} from "typeorm";
import { Users } from "./Users";

@Entity()
export class Teacher {
  @PrimaryGeneratedColumn()
  teacher_id!: number;

  @ManyToOne(() => Users, (users) => users.teacher)
  users?: Users;

  @Column({ type: "varchar", length: 255 })
  first_name?: string;

  @Column({ type: "varchar", length: 255 })
  last_name?: string;

  // @OneToMany(() => Join, (join) => join.teacher)
  // joins: Join[];
}
