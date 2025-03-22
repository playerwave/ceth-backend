import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Users } from "./Users";

@Entity("eventcoop")
export class EventCoop {
  @PrimaryGeneratedColumn()
  e_id!: number;

  @Column({ type: "varchar", length: 100, nullable: true })
  e_department?: string;

  @Column({ type: "int", nullable: true })
  e_grade?: number;

  @Column({ type: "timestamp", nullable: true })
  e_date?: Date;

  @OneToMany(() => Users, (users) => users.eventCoop)
  users?: Users[];
}
