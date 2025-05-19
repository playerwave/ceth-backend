import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Assessment } from './Assessment';
import { ActivityFood } from './ActivityFood';
import { ActivityDetail } from './ActivityDetail';
import { Room } from './Room';
import { Certificate } from './Certificate'

@Entity()
export class Activity {
    @PrimaryGeneratedColumn()
    activity_id!: number;

    @Column({ type: 'varchar', length: 255 })
    activity_name?: string;

    @Column({ type: 'varchar', length: 255 })
    presenter_company_name?: string;

    @Column({
        type: 'enum',
        enum: ['Soft', 'Hard'],
    })
    type?: 'Soft' | 'Hard';

    @Column({ type: 'text' })
    description?: string;

    @Column({ type: 'int' })
    seat?: number;

    @Column({ type: 'int' })
    recieve_hours?: number;

    @Column({
        type: 'enum',
        enum: ['Online', 'Onsite', 'Course'],
    })
    event_format?: 'Online' | 'Onsite' | 'Course';

    @Column({ type: 'timestamp' })
    create_activity_date?: Date;

    @Column({ type: 'timestamp' })
    special_start_register_date?: Date;

    @Column({ type: 'timestamp' })
    start_register_date?: Date;

    @Column({ type: 'timestamp' })
    end_register_date?: Date;

    @Column({ type: 'timestamp' })
    start_activity_date?: Date;

    @Column({ type: 'timestamp' })
    end_activity_date?: Date;

    @Column({ type: 'varchar', length: 255, nullable: true })
    image_url?: string;

    @Column({
        type: 'enum',
        enum: ['Private', 'Public'],
        default: 'Private',
    })
    activity_status?: 'Private' | 'Public';

    @Column({
        type: 'enum',
        enum: [
            'Not Start',
            'Special Open Register',
            'Open Register',
            'Close Register',
            'Start Activity',
            'End Activity',
            'Start Assessment',
            'End Assessment',
        ],
        default: 'Not Start',
    })
    activity_state?:
        | 'Not Start'
        | 'Special Open Register'
        | 'Open Register'
        | 'Close Register'
        | 'Start Activity'
        | 'End Activity'
        | 'Start Assessment'
        | 'End Assessment';

    @Column({
        type: 'enum',
        enum: ['Active', 'Inactive'],
        default: 'Inactive',
    })
    status?: 'Active' | 'Inactive';

    @Column({ type: 'timestamp' })
    last_update_activity_date?: Date;

    @Column({ type: 'varchar', length: 255, nullable: true })
    url?: string | null;

    @ManyToOne(() => Assessment, (assessment) => assessment.activity)
    @JoinColumn({ name: 'assessment_id' })
    assessment?: Assessment;

    @Column()
    assessment_id!: number;

    @ManyToOne(() => Room, (room) => room.activity)
    @JoinColumn({ name: 'room_id' })
    room?: Room;

    @Column()
    room_id!: number;

    @OneToMany(() => ActivityFood, (activityFood) => activityFood.activity)
    activityFood?: ActivityFood[];

    @OneToMany(() => ActivityDetail, (activityDetail) => activityDetail.activity)
    activityDetail?: ActivityDetail[];

    @OneToMany(() => Certificate, (certificate) => certificate.activity)
    certificate?: Certificate[];
}
