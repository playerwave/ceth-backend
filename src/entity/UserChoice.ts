import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User"; // Import Entity ของ User ที่สร้างไว้
import { Choice } from "./Choice"; // Import Entity ของ Choice ที่สร้างไว้

@Entity("userchoice")
export class UserChoice {
  @PrimaryColumn()
  u_id!: number;

  @PrimaryColumn()
  ch_id!: number;

  @Column({ type: "varchar", length: 50 })
  type?: string;

  @ManyToOne(() => User, (user) => user.u_id, { onDelete: "CASCADE" })
  @JoinColumn({ name: "u_id" })
  users?: User;

  @ManyToOne(() => Choice, (choice) => choice.ch_id, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ch_id" })
  choice?: Choice;
}
