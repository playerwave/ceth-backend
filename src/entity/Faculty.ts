import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Students } from "./Students";

@Entity()
export class Faculty {
  @PrimaryGeneratedColumn()
  faculty_id!: number;

  @Column({ type: "varchar", length: 255 })
  faculty_name?: string;

  @OneToMany(() => Students, (students) => students.faculty)
  students?: Students[];
}
