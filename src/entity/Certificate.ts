import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Students } from './Students';
import { Teacher } from './Teacher';
import { Activity } from './Activity';

@Entity()
export class Certificate {
    @PrimaryGeneratedColumn()
    certificate_id!: number;

    @ManyToOne(() => Students, (students) => students.certificate)
    @JoinColumn({ name: 'students_id' })
    students!: Students;

    @Column()
    students_id!: number;

    @ManyToOne(() => Teacher, (teacher) => teacher.certificate)
    @JoinColumn({ name: 'teacher_id' })
    teacher?: Teacher;

    @Column()
    teacher_id?: number;

    @ManyToOne(() => Activity, (activity) => activity.certificate)
    @JoinColumn({ name: 'activity_id' })
    activity?: Activity;

    @Column()
    activity_id?: number;

    @Column({ type: 'timestamp' })
    date?: Date;

    @Column({ type: 'int' })
    hours?: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    img?: string | null;

    @Column({
        type: 'enum',
        enum: ['Pending', 'Pass', 'Fail'],
        default: 'Pending',
    })
    status?: 'Pending' | 'Pass' | 'Fail';
}
