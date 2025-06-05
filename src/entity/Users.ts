import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Roles } from "./Roles";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  users_id!: number;

  @Column({ type: "varchar", length: 255, unique: true })
  username!: string;

  @Column({ type: "varchar", length: 255 })
  password!: string;

  @ManyToOne(() => Roles, (role) => role.users)
  @JoinColumn({ name: "roles_id" })
  roles!: Roles;
}
