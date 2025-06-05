import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("roles")
export class Roles {
  @PrimaryGeneratedColumn()
  roles_id!: number;

  @Column({ type: "varchar", length: 20, unique: true })
  roles_name!: "Student" | "Teacher" | "Admin";
}
