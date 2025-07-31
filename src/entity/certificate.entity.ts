// import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
// import { Students } from './students.entity';
// import { Teacher } from './teacher.entity';
// import { Activity } from './activity.entity';

// @Entity()
// export class Certificate {
//     @PrimaryGeneratedColumn()
//     certificate_id!: number;

//     @ManyToOne(() => Students, (students) => students.certificate)
//     @JoinColumn({ name: 'students_id' })
//     students!: Students;

//     @Column()
//     students_id!: number;

//     @ManyToOne(() => Teacher, (teacher) => teacher.certificate)
//     @JoinColumn({ name: 'teacher_id' })
//     teacher?: Teacher;

//     @Column()
//     teacher_id?: number;

//     @ManyToOne(() => Activity, (activity) => activity.certificate)
//     @JoinColumn({ name: 'activity_id' })
//     activity?: Activity;

//     @Column()
//     activity_id?: number;

//     @Column({ type: 'timestamp' })
//     date?: Date;

//     @Column({ type: 'int' })
//     hours?: number;

//     @Column({ type: 'varchar', length: 255, nullable: true })
//     img?: string | null;

//     @Column({
//         type: 'enum',
//         enum: ['Pending', 'Pass', 'Fail'],
//         default: 'Pending',
//     })
//     status?: 'Pending' | 'Pass' | 'Fail';
// }

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Students } from "./students.entity";
import { Teacher } from "./teacher.entity";
import { Activity } from "./activity.entity";

import { Transform } from "class-transformer";
import { parseISO } from "date-fns";
import { format } from "date-fns-tz";

@Entity()
@Index("IDX_STUDENTS_ID_CERTIFICATE", ["students_id"])
@Index("IDX_TEACHER_ID_CERTIFICATE", ["teacher_id"])
@Index("IDX_ACTIVITY_ID_CERTIFICATE", ["activity_id"])
@Index("IDX_DATE_CERTIFICATE", ["date"])
@Index("IDX_HOURS_CERTIFICATE", ["hours"])
@Index("IDX_IMG_CERTIFICATE", ["img"])
@Index("IDX_STATUS_CERTIFICATE", ["status"])
export class Certificate {
  @PrimaryGeneratedColumn()
  certificate_id!: number;

  @ManyToOne(() => Students, (students) => students.certificate)
  @JoinColumn({ name: "students_id" })
  students!: Students;

  @Column()
  students_id!: number;

  @ManyToOne(() => Teacher, (teacher) => teacher.certificate)
  @JoinColumn({ name: "teacher_id" })
  teacher?: Teacher;

  @Column()
  teacher_id?: number;

  @ManyToOne(() => Activity, (activity) => activity.certificate)
  @JoinColumn({ name: "activity_id" })
  activity?: Activity;

  @Column()
  activity_id?: number;

  @Column({ type: "timestamp" })
  @Transform(({ value }) =>
    value
      ? format(parseISO(value), "yyyy-MM-dd HH:mm:ss", {
          timeZone: "Asia/Bangkok",
        })
      : null
  )
  date?: Date;

  @Column({ type: "int" })
  hours?: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  img?: string | null;

  @Column({
    type: "enum",
    enum: ["Pending", "Pass", "Fail"],
    default: "Pending",
  })
  status?: "Pending" | "Pass" | "Fail";
}
