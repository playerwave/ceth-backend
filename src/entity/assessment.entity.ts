// import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
// import { SetNumber } from './setNumbers.entity';
// import { Answer } from './answer.entity';
// import { Activity } from './activity.entity';
// @Entity()
// export class Assessment {
//     @PrimaryGeneratedColumn()
//     assessment_id!: number;

//     @Column({ type: 'varchar', length: 255 })
//     assessment_name?: string;

//     @Column({ type: 'text' })
//     description?: string;

//     @Column({ type: 'timestamp' })
//     create_date?: Date;

//     @Column({ type: 'timestamp' })
//     last_update?: Date;

//     @Column({
//         type: 'enum',
//         enum: ['Not finished', 'Finished', 'Unsuccessful'],
//         default: 'Not finished',
//     })
//     assessment_status?: 'Not finished' | 'Finished' | 'Unsuccessful';

//     @ManyToOne(() => SetNumber, (setNumber) => setNumber.assessment)
//     @JoinColumn({ name: 'set_number_id' })
//     setNumber?: SetNumber;

//     @Column()
//     set_number_id?: number;

//     @Column({
//         type: 'enum',
//         enum: ['Active', 'Inactive'],
//         default: 'Active',
//     })
//     status?: 'Active' | 'Inactive';

//     @OneToMany(() => Answer, (answer) => answer.assessment)
//     answer?: Answer[];

//     @OneToMany(() => Activity, (activity) => activity.assessment)
//     activity?: Activity[];
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
import { SetNumber } from "./setNumbers.entity";
import { Answer } from "./answer.entity";
import { Activity } from "./activity.entity";

import { Transform } from "class-transformer";
import { parseISO } from "date-fns";
import { format } from "date-fns-tz";

@Entity()
@Index("IDX_ASSESSMENT_NAME_ASSESSMEN", ["assessment_name"])
@Index("IDX_DESCRIPTION_ASSESSMENT", ["description"])
@Index("IDX_CREATE_DATE_ASSESSMENT", ["create_date"])
@Index("IDX_LAST_UPDATE_ASSESSMENT", ["last_update"])
@Index("IDX_ASSESSMENT_STATUS", ["assessment_status"])
@Index("IDX_SET_NUMBER_ID_ASSESSMENT", ["set_number_id"])
@Index("IDX_STATUS_ASSESSMENT", ["status"])
export class Assessment {
  @PrimaryGeneratedColumn()
  assessment_id!: number;

  @Column({ type: "varchar", length: 255 })
  assessment_name?: string;

  @Column({ type: "text" })
  description?: string;

  @Column({ type: "timestamp" })
  @Transform(({ value }) =>
    value
      ? format(parseISO(value), "yyyy-MM-dd HH:mm:ss", {
          timeZone: "Asia/Bangkok",
        })
      : null
  )
  create_date?: Date;

  @Column({ type: "timestamp" })
  @Transform(({ value }) =>
    value
      ? format(parseISO(value), "yyyy-MM-dd HH:mm:ss", {
          timeZone: "Asia/Bangkok",
        })
      : null
  )
  last_update?: Date;

  @Column({
    type: "enum",
    enum: ["Not finished", "Finished", "Unsuccessful"],
    default: "Not finished",
  })
  assessment_status?: "Not finished" | "Finished" | "Unsuccessful";

  @ManyToOne(() => SetNumber, (setNumber) => setNumber.assessment)
  @JoinColumn({ name: "set_number_id" })
  setNumber?: SetNumber;

  @Column({ type: "int" })
  set_number_id?: number;

  @Column({
    type: "enum",
    enum: ["Active", "Inactive"],
    default: "Active",
  })
  status?: "Active" | "Inactive";

  @OneToMany(() => Answer, (answer) => answer.assessment)
  answer?: Answer[];

  @OneToMany(() => Activity, (activity) => activity.assessment)
  activity?: Activity[];
}
