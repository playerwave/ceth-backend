import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("activity")
export class Activity {
  @PrimaryGeneratedColumn()
  ac_id!: number;

  @Column({ type: "varchar", length: 255 })
  ac_name!: string;

  @Column({ type: "varchar", length: 255 })
  ac_company_lecturer!: string;

  @Column({ type: "text" })
  ac_description!: string;

  @Column({ type: "varchar", length: 100 })
  ac_type!: string;

  @Column({ type: "varchar", length: 100 })
  ac_room!: string;

  @Column({ type: "integer" })
  ac_seat!: number;

  @Column({ type: "varchar", length: 100 })
  ac_food!: string;

  @Column({ type: "varchar", length: 50 })
  ac_status!: string;

  @Column({ type: "timestamp", nullable: true })
  ac_start_register!: Date;

  @Column({ type: "timestamp", nullable: true })
  ac_end_register!: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  ac_create_date!: Date;

  @Column({ type: "timestamp", nullable: true })
  ac_last_update!: Date;

  @Column({ type: "integer" })
  ac_registered_count!: number;

  @Column({ type: "integer" })
  ac_attended_count!: number;

  @Column({ type: "integer" })
  ac_not_attended_count!: number;

  @Column({ type: "timestamp", nullable: true })
  ac_start_time!: Date;

  @Column({ type: "timestamp", nullable: true })
  ac_end_time!: Date;

  @Column({ type: "varchar", length: 255, nullable: true })
  ac_image_url!: string;
}
