import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Activity } from './Activity';
import { Food } from './Food';
import { ActivityDetail } from './ActivityDetail';

@Entity()
export class ActivityFood {
    @PrimaryGeneratedColumn()
    activity_food_id!: number;

    @ManyToOne(() => Activity, (activity) => activity.activityFood)
    @JoinColumn({ name: 'activity_id' })
    activity!: Activity;

    @Column()
    activity_id!: number;

    @ManyToOne(() => Food, (food) => food.activityFood)
    @JoinColumn({ name: 'food_id' })
    food!: Food;

    @Column()
    food_id!: number;

    @OneToMany(() => ActivityDetail, (activityDetail) => activityDetail.activityFood)
    activityDetail?: ActivityDetail[];
}
