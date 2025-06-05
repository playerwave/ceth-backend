import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./User"; // Import User entity
import { Activity } from "./Activity"; // Import Activity entity

@Entity("user_activity")
export class UserActivity {
  @PrimaryGeneratedColumn()
  user_activity_id!: number;

  @ManyToOne(() => User, (user) => user.userActivities, { nullable: false })
  @JoinColumn({ name: "user_id" })
  user!: User;

  @ManyToOne(() => Activity, (activity) => activity.userActivities, { nullable: false })
  @JoinColumn({ name: "activity_id" })
  activity!: Activity;
}
