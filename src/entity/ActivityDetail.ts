import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Join } from './Join';
import { Activity } from './Activity';
import { ActivityFood } from './ActivityFood';

@Entity()
export class ActivityDetail {
    @PrimaryGeneratedColumn()
    activity_detail_id!: number;

    @ManyToOne(() => Join, (join) => join.activityDetail)
    @JoinColumn({ name: 'join_id' })
    join!: Join;

    @Column()
    join_id!: number;

    @ManyToOne(() => Activity, (activity) => activity.activityDetail)
    @JoinColumn({ name: 'activity_id' })
    activity!: Activity;

    @Column()
    activity_id!: number;

    @ManyToOne(() => ActivityFood, (activityFood) => activityFood.activityDetail)
    @JoinColumn({ name: 'activity_food_id' })
    activityFood?: ActivityFood

    @Column()
    activity_food_id?: number; 

    @Column({ type: 'timestamp' })
    register_date?: Date;

    @Column({ type: 'timestamp' })
    time_in?: Date;

    @Column({ type: 'timestamp' })
    time_out?: Date;

    @Column({
        type: 'enum',
        enum: ['Registered', 'Cancelled'],
        default: 'Registered',
    })
    status?: 'Registered' | 'Cancelled';
}
