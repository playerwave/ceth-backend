import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Students } from "./Students";
import { Teacher } from "./Teacher";
import { ActivityDetail } from "./ActivityDetail";

@Entity("join")
export class Join {
  @PrimaryGeneratedColumn()
  join_id!: number;

  @ManyToOne(() => Students, (student) => student.joins, {
    nullable: false,
  })
  @JoinColumn({ name: "students_id" })
  students!: Students;

  @ManyToOne(() => Teacher, (teacher) => teacher.joins, {
    nullable: false,
  })
  @JoinColumn({ name: "teacher_id" })
  teacher!: Teacher;

  @Column({ type: "timestamp" })
  join_date!: Date;

  @Column({
    type: "varchar",
    length: 10,
    nullable: false,
    default: "Pending",
  })
  status: "Pending" | "Completed" | "Cancelled";

  @ManyToOne(() => ActivityDetail, (activityDetail) => activityDetail.joins, {
    nullable: false,
  })
  @JoinColumn({ name: "activity_detail_id" })
  activityDetail!: ActivityDetail;
}
