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

  @Column({ type: "enum", enum: ["Student", "Teacher", "Admin"] })
  roles_name?: string;

  @OneToMany(() => Users, (users) => users.roles)
  users?: Users[];
}
