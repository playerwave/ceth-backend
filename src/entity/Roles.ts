import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Unique,
} from "typeorm";
import { Users } from "./Users";

@Entity()
@Unique(["roles_name"])
export class Roles {
  @PrimaryGeneratedColumn()
  roles_id!: number;

  @Column({
    type: 'enum',
    enum: ['Admin', 'Teacher', 'Student'],
    unique: true,
    default: 'Student'
  })
  roles_name?: 'Student' | 'Teacher' | 'Admin';


  @OneToMany(() => Users, (users) => users.roles)
  users?: Users[];
}
