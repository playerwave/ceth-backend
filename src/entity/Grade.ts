import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { EventCoop } from "./EventCoop";
import { Students } from "./Students";

@Entity()
export class Grade {
  @PrimaryGeneratedColumn()
  grade_id!: number;

  @Column({ type: 'enum', enum: [1, 2, 3, 4], unique: true })
  level!: 1 | 2 | 3 | 4;

  @OneToMany(() => EventCoop, (eventCoop) => eventCoop.grade)
  eventCoop?: EventCoop[];

  @OneToMany(() => Students, (students) => students.grade)
  students!: Students[];
}
