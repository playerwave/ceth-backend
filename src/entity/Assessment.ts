import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { SetNumber } from './SetNumber';
import { Answer } from './Answer';
import { Activity } from './Activity';
@Entity()
export class Assessment {
    @PrimaryGeneratedColumn()
    assessment_id!: number;

    @Column({ type: 'varchar', length: 255 })
    assessment_name?: string;

    @Column({ type: 'text' })
    description?: string;

    @Column({ type: 'timestamp' })
    create_date?: Date;

    @Column({ type: 'timestamp' })
    last_update?: Date;

    @Column({
        type: 'enum',
        enum: ['Not finished', 'Finished', 'Unsuccessful'],
        default: 'Not finished',
    })
    assessment_status?: 'Not finished' | 'Finished' | 'Unsuccessful';

    @ManyToOne(() => SetNumber, (setNumber) => setNumber.assessment)
    @JoinColumn({ name: 'set_number_id' })
    setNumber?: SetNumber;

    @Column()
    set_number_id?: number;

    @Column({
        type: 'enum',
        enum: ['Active', 'Inactive'],
        default: 'Active',
    })
    status?: 'Active' | 'Inactive';

    @OneToMany(() => Answer, (answer) => answer.assessment)
    answer?: Answer[];

    @OneToMany(() => Activity, (activity) => activity.assessment)
    activity?: Activity[];
}
