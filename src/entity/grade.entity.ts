import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  Index,
} from "typeorm";
import { Students } from "./students.entity";
import { EventCoop } from "./eventcoop.entity";

@Entity()
@Index("IDX_LEVEL_GRADE", ["level"])
@Index("IDX_DESCRIPTION_GRADE", ["description"])
export class Grade {
  @PrimaryGeneratedColumn()
  grade_id!: number;

  @Column({ type: 'enum', enum: [1, 2, 3, 4], nullable: true })
  level!: 1 | 2 | 3 | 4 | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  description?: string;

  @OneToMany(() => EventCoop, (eventCoop) => eventCoop.grade)
  eventCoop?: EventCoop[];

  @OneToMany(() => Students, (students) => students.grade)
  students?: Students[];
}