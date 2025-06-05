import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Faculty } from "./Faculty";

@Entity("teacher")
export class Teacher {
  @PrimaryGeneratedColumn()
  teacher_id!: number;

  @Column({ type: "varchar", length: 255 })
  first_name!: string;

  @Column({ type: "varchar", length: 255 })
  last_name!: string;

  @ManyToOne(() => Faculty, (faculty) => faculty.teachers)
  @JoinColumn({ name: "faculty_id" })
  faculty!: Faculty;
}
