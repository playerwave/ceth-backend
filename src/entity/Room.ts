import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Faculty } from "./Faculty";
import { Building } from "./Building";

@Entity("room")
export class Room {
  @PrimaryGeneratedColumn()
  room_id!: number;

  @ManyToOne(() => Faculty, (faculty) => faculty.rooms)
  @JoinColumn({ name: "faculty_id" })
  faculty!: Faculty;

  @Column({ type: "varchar", length: 255 })
  room_name!: string;

  @Column({ type: "varchar", length: 255 })
  floor!: string;

  @Column({ type: "int" })
  seat_number!: number;

  @ManyToOne(() => Building, (building) => building.rooms)
  @JoinColumn({ name: "building_id" })
  building!: Building;

  @Column({ type: "varchar", length: 20 })
  status!: "ใช้งานอยู่" | "ว่าง";
}
