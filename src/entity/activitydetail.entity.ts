import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Activity } from "./activity.entity";
import { ActivityFood } from "./activity.food.entity";

import { Transform } from "class-transformer";
import { parseISO } from "date-fns";
import { format } from "date-fns-tz";

@Entity()
@Index("IDX_ACTIVITY_ID_ACTIVITYDETIAL", ["activity_id"])
@Index("IDX_ACTIVITY_FOOD_ID_ACTIVITYDETIAL", ["activity_food_id"])
@Index("IDX_REGISTER_DATE_ACTIVITYDETIAL", ["register_date"])
@Index("IDX_TIME_IN_ACTIVITYDETIAL", ["time_in"])
@Index("IDX_TIME_OUT_ACTIVITYDETIAL", ["time_out"])
@Index("IDX_STATUS_ACTIVITYDETAIL", ["status"])
export class ActivityDetail {
  @PrimaryGeneratedColumn()
  activity_detail_id!: number;

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

  @Column({ type: "timestamp", nullable: true })
  @Transform(({ value }) =>
    value
      ? format(parseISO(value), "yyyy-MM-dd HH:mm:ss", {
          timeZone: "Asia/Bangkok",
        })
      : null
  )
  time_in?: Date | null;

  @Column({ type: "timestamp", nullable: true })
  @Transform(({ value }) =>
    value
      ? format(parseISO(value), "yyyy-MM-dd HH:mm:ss", {
          timeZone: "Asia/Bangkok",
        })
      : null
  )
  time_out?: Date | null;

  @Column({
    type: "enum",
    enum: ["Registered", "Cancelled"],
    default: "Registered",
  })
  status?: "Registered" | "Cancelled";
}
