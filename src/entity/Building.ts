import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Faculty } from "./Faculty";

@Entity("building")
export class Building {
  @PrimaryGeneratedColumn()
  building_id!: number;

  @ManyToOne(() => Faculty, (faculty) => faculty.buildings)
  @JoinColumn({ name: "faculty_id" })
  faculty!: Faculty;

  @Column({ type: "varchar", length: 255, unique: true })
  building_name!: string;
}
