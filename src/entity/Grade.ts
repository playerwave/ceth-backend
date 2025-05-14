import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { EventCoop } from "./EventCoop";
import { Students } from "./Students";

@Entity()
export class Grade {
  @PrimaryGeneratedColumn()
  grade_id!: number;

  @Column({ type: "enum", enum: [1, 2, 3, 4] })
  level?: number;

  @OneToMany(() => EventCoop, (eventCoop) => eventCoop.grade)
  eventCoops?: EventCoop[];

  @OneToMany(() => Students, (students) => students.users)
  students!: Students[];
}
