import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "activity" }) // ✅ Force table name to match PostgreSQL
export class Activity {
  @PrimaryGeneratedColumn()
  ac_id!: number; // ✅ Primary key (Cannot be null)

  @Column({ type: "varchar", nullable: true })
  ac_name!: string | null; // ✅ Allows null values

  @Column({ type: "varchar", nullable: true })
  ac_company_lecturer!: string | null;

  @Column({ type: "text", nullable: true })
  ac_description!: string | null;

  @Column({ type: "varchar", nullable: true })
  ac_type!: string | null;

  @Column({ type: "varchar", nullable: true })
  ac_room!: string | null;

  @Column({ type: "integer", nullable: true })
  ac_seat!: number | null;

  @Column({ type: "varchar", nullable: true })
  ac_food!: string | null;

  @Column({ type: "varchar", nullable: true })
  ac_status!: string | null;

  @Column({ type: "timestamp", nullable: true })
  ac_start_register!: Date | null;

  @Column({ type: "timestamp", nullable: true })
  ac_end_register!: Date | null;

  @Column({ type: "timestamp", nullable: true })
  ac_create_date!: Date | null;

  @Column({ type: "timestamp", nullable: true })
  ac_last_update!: Date | null;

  @Column({ type: "integer", nullable: true })
  ac_registered_count!: number | null;

  @Column({ type: "integer", nullable: true })
  ac_attended_count!: number | null;

  @Column({ type: "integer", nullable: true })
  ac_not_attended_count!: number | null;

  @Column({ type: "date", nullable: true })
  ac_date!: Date | null;

  @Column({ type: "date", nullable: true })
  ac_date_finish!: Date | null;

  @Column({ type: "varchar", nullable: true })
  ac_image_url!: string | null;
}
