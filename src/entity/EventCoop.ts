import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { User } from "./User"; // สมมติว่า entity สำหรับ user อยู่ในไฟล์ User.ts

@Entity("event_coop")
export class EventCoop {
  @PrimaryGeneratedColumn()
  e_id!: number;

  @Column({ type: "varchar", length: 100, nullable: true })
  e_department?: string;

  @Column({ type: "int", nullable: true })
  e_grade?: number;

  @Column({ type: "timestamp", nullable: true })
  e_date?: Date;

  @OneToMany(() => User, (user) => user.eventCoop)
  users?: User[];
}
