import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Question } from "./Question"; // Import Question entity

@Entity("set_number")
export class SetNumber {
  @PrimaryGeneratedColumn()
  set_number_id!: number;

  @Column({ type: "int", nullable: false })
  number!: number;

  @Column({ type: "varchar", length: 255, nullable: false })
  name!: string;

  @Column({
    type: "varchar",
    length: 10,
    nullable: false,
    default: "Active",
  })
  status!: "Active" | "Inactive";

  @OneToMany(() => Question, (question) => question.set_number)
  questions!: Question[];
}
