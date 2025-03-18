import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { UserActivity } from "./UserActivity";

@Entity("user")
export class User {
  @PrimaryGeneratedColumn()
  u_id!: number; // Primary Key

  @Column({ type: "varchar", length: 255, unique: true })
  u_std_id!: string; // รหัสนิสิต

  @Column({ type: "varchar", length: 255 })
  u_fullname!: string; // ชื่อ-นามสกุล

  @Column({ type: "varchar", length: 50, default: "student" })
  u_role!: string; // Role (admin, student)

  @Column({ type: "int", default: 0 })
  u_risk_point!: number; // คะแนน Risk

  @Column({ type: "int", default: 0 })
  u_soft_hours!: number; // ชั่วโมง Soft Skills

  @Column({ type: "int", default: 0 })
  u_hard_hours!: number; // ชั่วโมง Hard Skills

  @Column({ type: "varchar", length: 255, nullable: true })
  u_department?: string; // ภาควิชา

  @Column({ type: "varchar", length: 50, nullable: true })
  u_risk_status?: string; // สถานะความเสี่ยง (ใหม่)

  // เชื่อมกับ UserActivity (กิจกรรมที่ user มีส่วนร่วม)
  @OneToMany(() => UserActivity, (userActivity) => userActivity.user)
  activities!: UserActivity[];
}
