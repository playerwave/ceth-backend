// import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
// import { Students } from './students.entity';
// import { Teacher } from './teacher.entity';
// import { ActivityDetail } from './activitydetail.entity';
// import { Answer } from './answer.entity';
// @Entity()
// export class Join {
//     @PrimaryGeneratedColumn()
//     join_id!: number;

//     @ManyToOne(() => Students, (students) => students.join)
//     @JoinColumn({ name: 'students_id' })
//     students!: Students;

//     @Column()
//     students_id!: number;

//     @ManyToOne(() => Teacher, (teacher) => teacher.join)
//     @JoinColumn({ name: 'teacher_id' })
//     teacher!: Teacher;

//     @Column()
//     teacher_id!: number;

//     @Column({ type: 'timestamp' })
//     join_date?: Date;

//     @Column({
//         type: 'enum',
//         enum: ['Pending', 'Completed', 'Cancelled'],
//         default: 'Pending',
//     })
//     status?: 'Pending' | 'Completed' | 'Cancelled';

//     @ManyToOne(() => ActivityDetail, (activityDetail) => activityDetail.join)
//     @JoinColumn({ name: 'activity_detail_id' })
//     activityDetail?: ActivityDetail;

//     @Column()
//     activity_detail_id!: number;

//     @OneToMany(() => Answer, (answer) => answer.join)
//     answer?: Answer[];

// }

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from "typeorm";
import { Students } from "./students.entity";
import { Teacher } from "./teacher.entity";
import { ActivityDetail } from "./activitydetail.entity";
import { Answer } from "./answer.entity";

import { Transform } from "class-transformer";
import { parseISO } from "date-fns";
import { format } from "date-fns-tz";

@Entity()
@Index("IDX_STUDENTS_ID_JOIN", ["students_id"])
@Index("IDX_TEACHER_ID_JOIN", ["teacher_id"])
@Index("IDX_JOIN_DATE_JOIN", ["join_date"])
@Index("IDX_STATUS_JOIN", ["status"])
@Index("IDX_ACTIVITY_DETAIL_ID_JOIN", ["activity_detail_id"])
export class Join {
  @PrimaryGeneratedColumn()
  join_id!: number;

  @ManyToOne(() => Students, (students) => students.join)
  @JoinColumn({ name: "students_id" })
  students!: Students;

  @Column()
  students_id!: number;

  @ManyToOne(() => Teacher, (teacher) => teacher.join)
  @JoinColumn({ name: "teacher_id" })
  teacher!: Teacher;

  @Column()
  teacher_id!: number;

  @Column({ type: "timestamp" })
  @Transform(({ value }) =>
    value
      ? format(parseISO(value), "yyyy-MM-dd HH:mm:ss", {
          timeZone: "Asia/Bangkok",
        })
      : null
  )
  join_date?: Date;

  @Column({
    type: "enum",
    enum: ["Pending", "Completed", "Cancelled"],
    default: "Pending",
  })
  status?: "Pending" | "Completed" | "Cancelled";

  @ManyToOne(() => ActivityDetail, (activityDetail) => activityDetail.join)
  @JoinColumn({ name: "activity_detail_id" })
  activityDetail?: ActivityDetail;

  @Column()
  activity_detail_id!: number;

  @OneToMany(() => Answer, (answer) => answer.join)
  answer?: Answer[];
}
