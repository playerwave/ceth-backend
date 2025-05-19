import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Students } from './Students';
import { Teacher } from './Teacher';
import { ActivityDetail } from './ActivityDetail';
import { Answer } from './Answer';
@Entity()
export class Join {
    @PrimaryGeneratedColumn()
    join_id!: number;

    @ManyToOne(() => Students, (students) => students.join)
    @JoinColumn({ name: 'students_id' })
    students!: Students;

    @Column()
    students_id!: number;

    @ManyToOne(() => Teacher, (teacher) => teacher.join)
    @JoinColumn({ name: 'teacher_id' })
    teacher!: Teacher;

    @Column()
    teacher_id!: number;

    @Column({ type: 'timestamp' })
    join_date?: Date;

    @Column({
        type: 'enum',
        enum: ['Pending', 'Completed', 'Cancelled'],
        default: 'Pending',
    })
    status?: 'Pending' | 'Completed' | 'Cancelled';


    @ManyToOne(() => ActivityDetail, (activityDetail) => activityDetail.join)
    @JoinColumn({ name: 'activity_detail_id' })
    activityDetail?: ActivityDetail;

    @Column()
    activity_detail_id!: number;

    @OneToMany(() => Answer, (answer) => answer.join)
    answer?: Answer[];

}
