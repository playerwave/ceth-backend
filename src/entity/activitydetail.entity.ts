// import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
// import { Join } from './join.entity';
// import { Activity } from './activity.entity';
// import { ActivityFood } from './activity.food.entity';

// @Entity()
// export class ActivityDetail {
//     @PrimaryGeneratedColumn()
//     activity_detail_id!: number;

//     @ManyToOne(() => Join, (join) => join.activityDetail)
//     @JoinColumn({ name: 'join_id' })
//     join!: Join;

//     @Column()
//     join_id!: number;

//     @ManyToOne(() => Activity, (activity) => activity.activityDetail)
//     @JoinColumn({ name: 'activity_id' })
//     activity!: Activity;

//     @Column()
//     activity_id!: number;

//     @ManyToOne(() => ActivityFood, (activityFood) => activityFood.activityDetail)
//     @JoinColumn({ name: 'activity_food_id' })
//     activityFood?: ActivityFood

//     @Column()
//     activity_food_id?: number;

//     @Column({ type: 'timestamp' })
//     register_date?: Date;

//     @Column({ type: 'timestamp' })
//     time_in?: Date;

//     @Column({ type: 'timestamp' })
//     time_out?: Date;

//     @Column({
//         type: 'enum',
//         enum: ['Registered', 'Cancelled'],
//         default: 'Registered',
//     })
//     status?: 'Registered' | 'Cancelled';
// }

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Join } from "./join.entity";
import { Activity } from "./activity.entity";
import { ActivityFood } from "./activity.food.entity";

import { Transform } from "class-transformer";
import { parseISO } from "date-fns";
import { format } from "date-fns-tz";

@Entity()
@Index("IDX_JOIN_ID_ACTIVITYDETIAL", ["join_id"])
@Index("IDX_ACTIVITY_ID_ACTIVITYDETIAL", ["activity_id"])
@Index("IDX_ACTIVITY_FOOD_ID_ACTIVITYDETIAL", ["activity_food_id"])
@Index("IDX_REGISTER_DATE_ACTIVITYDETIAL", ["register_date"])
@Index("IDX_TIME_IN_ACTIVITYDETIAL", ["time_in"])
@Index("IDX_TIME_OUT_ACTIVITYDETIAL", ["time_out"])
@Index("IDX_STATUS_ACTIVITYDETAIL", ["status"])
export class ActivityDetail {
  @PrimaryGeneratedColumn()
  activity_detail_id!: number;

  @ManyToOne(() => Join, (join) => join.activityDetail)
  @JoinColumn({ name: "join_id" })
  join!: Join;

  @Column()
  join_id!: number;

  @ManyToOne(() => Activity, (activity) => activity.activityDetail)
  @JoinColumn({ name: "activity_id" })
  activity!: Activity;

  @Column()
  activity_id!: number;

  @ManyToOne(() => ActivityFood, (activityFood) => activityFood.activityDetail)
  @JoinColumn({ name: "activity_food_id" })
  activityFood?: ActivityFood;

  @Column()
  activity_food_id?: number;

  @Column({ type: "timestamp" })
  @Transform(({ value }) =>
    value
      ? format(parseISO(value), "yyyy-MM-dd HH:mm:ss", {
          timeZone: "Asia/Bangkok",
        })
      : null
  )
  register_date?: Date;

  @Column({ type: "timestamp" })
  @Transform(({ value }) =>
    value
      ? format(parseISO(value), "yyyy-MM-dd HH:mm:ss", {
          timeZone: "Asia/Bangkok",
        })
      : null
  )
  time_in?: Date;

  @Column({ type: "timestamp" })
  @Transform(({ value }) =>
    value
      ? format(parseISO(value), "yyyy-MM-dd HH:mm:ss", {
          timeZone: "Asia/Bangkok",
        })
      : null
  )
  time_out?: Date;

  @Column({
    type: "enum",
    enum: ["Registered", "Cancelled"],
    default: "Registered",
  })
  status?: "Registered" | "Cancelled";
}
