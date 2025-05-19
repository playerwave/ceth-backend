import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { Users } from "./Users";
import { Faculty } from "./Faculty";
import { Join } from "./Join";
import { Certificate } from './Certificate'
@Entity()
export class Teacher {
  @PrimaryGeneratedColumn()
  teacher_id!: number;

  @ManyToOne(() => Users, (users) => users.teacher)
  @JoinColumn({ name: 'users_id' })
  users!: Users

  @Column()
  users_id!: number;

  @Column({ type: "varchar", length: 255 })
  first_name?: string;

  @Column({ type: "varchar", length: 255 })
  last_name?: string;

  @ManyToOne(() => Faculty, (faculty) => faculty.teacher)
  @JoinColumn({ name: 'faculty_id' })
  faculty!: Faculty;

  @Column()
  faculty_id!: number;

  @OneToMany(() => Join, (join) => join.teacher)
  join?: Join[];

  @OneToMany(() => Certificate, (certificate) => certificate.teacher)
  certificate?: Certificate[];
}
