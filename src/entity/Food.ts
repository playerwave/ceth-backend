import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Faculty } from './Faculty';
import { ActivityFood } from './ActivityFood';
@Entity()
export class Food {
    @PrimaryGeneratedColumn()
    food_id!: number;

    @Column({ type: 'varchar', length: 255, unique: true })
    food_name?: string;

    @Column({ type: 'enum', enum: ['Active', 'Inactive'], default: 'Active' })
    status?: 'Active' | 'Inactive';

    @ManyToOne(() => Faculty, (faculty) => faculty.food)
    @JoinColumn({ name: 'faculty_id' })
    faculty!: Faculty;

    @Column()
    faculty_id!: number;

    @OneToMany(() => ActivityFood, (activityFood) => activityFood.food)
    activityFood?: ActivityFood[];
}
