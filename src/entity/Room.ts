import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Faculty } from './Faculty';
import { Building } from './Building';
import { Activity } from './Activity';

@Entity()
export class Room {
    @PrimaryGeneratedColumn()
    room_id!: number;

    @ManyToOne(() => Faculty, (faculty) => faculty.room)
    @JoinColumn({ name: 'faculty_id' })
    faculty!: Faculty;

    @Column()
    faculty_id!: number;

    @ManyToOne(() => Building, (building) => building.room)
    @JoinColumn({ name: 'building_id' })
    building?: Building;

    @Column()
    building_id?: number;

    @Column({ type: 'varchar', length: 255, unique: true })
    room_name?: string;

    @Column({ type: 'varchar', length: 255 })
    floor?: string;

    @Column({ type: 'int' })
    seat_number?: number;

    @Column({ type: 'enum', enum: ['Active', 'Available'] })
    status?: 'Active' | 'Available';

    @OneToMany(() => Activity, (activity) => activity.room)
    activity?: Activity[];
}
