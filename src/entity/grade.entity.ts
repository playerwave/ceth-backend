import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { EventCoop } from "./eventcoop.entity";
import { Students } from "./students.entity";

@Entity()
export class Grade {
  @PrimaryGeneratedColumn()
  grade_id!: number;

  @Column({ type: 'enum', enum: [1, 2, 3, 4], nullable: true })
  level!: 1 | 2 | 3 | 4 | null;

  @OneToMany(() => EventCoop, (eventCoop) => eventCoop.grade)
  eventCoop?: EventCoop[];

  @OneToMany(() => Students, (students) => students.grade)
  students!: Students[];
}