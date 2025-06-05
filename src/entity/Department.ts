import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Faculty } from "./Faculty";

@Entity("department")
export class Department {
  @PrimaryGeneratedColumn()
  department_id!: number;

  @Column({ type: "varchar", length: 255, unique: true })
  department_name!: string;

  @ManyToOne(() => Faculty, (faculty) => faculty.departments)
  @JoinColumn({ name: "faculty_id" })
  faculty!: Faculty;
}
