import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Faculty } from "./Faculty"; // Import Faculty entity

@Entity("food")
export class Food {
  @PrimaryGeneratedColumn()
  food_id!: number;

  @Column({ type: "varchar", length: 255, unique: true })
  food_name!: string;

  @Column({ type: "varchar", length: 10, nullable: false, default: "Active" })
  status: "Active" | "Inactive" = "Active"; // Default is Active

  @ManyToOne(() => Faculty, (faculty) => faculty.foods, { nullable: false })
  @JoinColumn({ name: "faculty_id" })
  faculty!: Faculty;
}
