import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { Faculty } from "./faculty.entity";
import { ActivityFood } from "./activity.food.entity";
@Entity()
export class Food {
  @PrimaryGeneratedColumn("increment")
  food_id!: number;

  @Column({ type: "varchar", length: 255 })
  food_name?: string;

  @Column({ type: "enum", enum: ["Active", "Inactive"], default: "Active" })
  status?: "Active" | "Inactive";

  @ManyToOne(() => Faculty, (faculty) => faculty.food)
  @JoinColumn({ name: "faculty_id" })
  faculty!: Faculty;

  @Column()
  faculty_id!: number;

  @OneToMany(() => ActivityFood, (activityFood) => activityFood.food)
  activityFood?: ActivityFood[];
}
