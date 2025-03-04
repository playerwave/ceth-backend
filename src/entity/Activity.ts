import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("activity")
export class Activity {
  @PrimaryGeneratedColumn()
  ac_id!: number;

  @Column({ type: "varchar", length: 255, nullable: false })
  ac_name!: string;

  @Column({ type: "varchar", length: 255, nullable: false })
  ac_company_lecturer!: string;

  @Column({ type: "text", nullable: false })
  ac_description!: string;

  @Column({ type: "varchar", length: 100, nullable: false })
  ac_type!: string;

  @Column({ type: "varchar", length: 100, nullable: false })
  ac_room?: string;

  @Column({ type: "int", nullable: false })
  ac_seat!: number;

  @Column({ type: "varchar", length: 100, nullable: true })
  ac_food?: string;

  @Column({ type: "varchar", length: 50, nullable: false })
  ac_status!: string;

  @Column({ type: "timestamp", nullable: false })
  ac_start_register!: Date;

  @Column({ type: "timestamp", nullable: false })
  ac_end_register!: Date;

  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  ac_create_date!: Date;

  @Column({ type: "timestamp", nullable: false, onUpdate: "CURRENT_TIMESTAMP" })
  ac_last_update?: Date;

  @Column({ type: "int", nullable: false, default: 0 })
  ac_registered_count!: number;

  @Column({ type: "int", nullable: false, default: 0 })
  ac_attended_count!: number;

  @Column({ type: "int", nullable: false, default: 0 })
  ac_not_attended_count!: number;

  @Column({ type: "timestamp", nullable: false })
  ac_start_time!: Date;

  @Column({ type: "timestamp", nullable: false })
  ac_end_time!: Date;

  @Column({ type: "varchar", length: 255, nullable: false })
  ac_image_url!: string;

  @Column({ type: "timestamp", nullable: false })
  ac_normal_register!: Date;
}
