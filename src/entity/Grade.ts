import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("grade")
export class Grade {
  @PrimaryGeneratedColumn()
  grade_id!: number;

  @Column({ type: "int", unique: true })
  level!: 1 | 2 | 3 | 4;
}
