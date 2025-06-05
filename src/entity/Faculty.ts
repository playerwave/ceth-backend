import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("faculty")
export class Faculty {
  @PrimaryGeneratedColumn()
  faculty_id!: number;

  @Column({ type: "varchar", length: 255, unique: true })
  faculty_name!: string;
}
