// import {
//     Entity,
//     PrimaryGeneratedColumn,
//     Column,
//     ManyToOne,
//     OneToMany,
//     JoinColumn
// } from "typeorm";
// import { Department } from "./department.entity";
// import { Grade } from "./grade.entity";
// import { Students } from "./students.entity";

// @Entity()
// export class EventCoop {
//     @PrimaryGeneratedColumn()
//     eventcoop_id!: number;

//     @ManyToOne(() => Department, (department) => department.eventCoop)
//     @JoinColumn({ name: 'department_id' })
//     department!: Department;

//     @Column()
//     department_id!: number;

//     @ManyToOne(() => Grade, (grade) => grade.eventCoop)
//     @JoinColumn({ name: 'grade_id' })
//     grade!: Grade;

//     @Column()
//     grade_id!: number;

//     @Column({ type: "timestamp" })
//     date?: Date;

//     @OneToMany(() => Students, (students) => students.eventCoop)
//     students!: Students[];
// }

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { Department } from "./department.entity";
import { Grade } from "./grade.entity";
import { Students } from "./students.entity";

import { Transform } from "class-transformer";
import { parseISO } from "date-fns";
import { format } from "date-fns-tz";

@Entity("event_coop")
@Index("IDX_DEPARTMENT_ID_EVENTCOOP", ["department_id"])
@Index("IDX_GRADE_ID_EVENTCOOP", ["grade_id"])
@Index("IDX_DATE_EVENTCOOP", ["date"])
export class EventCoop {
  @PrimaryGeneratedColumn()
  eventcoop_id!: number;

  @ManyToOne(() => Department, (department) => department.eventCoop)
  @JoinColumn({ name: "department_id" })
  department!: Department;

  @Column({ type: "int" })
  department_id!: number;

  @ManyToOne(() => Grade, (grade) => grade.eventCoop)
  @JoinColumn({ name: "grade_id" })
  grade!: Grade;

  @Column({ type: "int" })
  grade_id!: number;

  @Column({ type: "timestamp", nullable: true })
  @Transform(({ value }) =>
    value
      ? format(parseISO(value), "yyyy-MM-dd HH:mm:ss", {
          timeZone: "Asia/Bangkok",
        })
      : null
  )
  date?: Date;

  @Column({ type: "int", nullable: true })
  remaining_days!: number;

  @Column({ type: "boolean", nullable: true, default: false })
  is_on_coop!: boolean;

  @OneToMany(() => Students, (students) => students.eventCoop)
  students!: Students[];
}
