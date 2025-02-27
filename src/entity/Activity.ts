import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Activity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  activity_name!: string;

  @Column()
  activity_company_lecturer!: string;

  @Column()
  activity_description!: string;

  @Column()
  activity_type!: string;

  @Column()
  activity_room!: string;

  @Column()
  activity_seat!: number;

  @Column("jsonb")
  activity_food!: { [key: string]: string };

  @Column("text", { array: true })
  activity_status!: string[];

  @Column()
  activity_start_time!: string;

  @Column()
  activity_end_time!: string;

  @Column()
  activity_create_date!: string;

  @Column()
  activity_last_update!: string;

  @Column()
  activity_end_enrolled_date!: string;

  @Column()
  activity_registered_count!: number;

  @Column()
  activity_attended_count!: number;

  @Column()
  activity_not_attended_count!: number;

  @Column()
  activity_date!: string;

  @Column()
  activity_image_url!: string;
}
