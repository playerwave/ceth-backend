import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Faculty } from './Faculty';
import { Room } from './Room';

@Entity()
export class Building {
    @PrimaryGeneratedColumn()
    building_id!: number;

    @ManyToOne(() => Faculty, (faculty) => faculty.building)
    @JoinColumn({ name: 'faculty_id' })
    faculty!: Faculty;

    @Column()
    faculty_id!: number;

    @Column({ type: 'varchar', length: 255, unique: true })
    building_name?: string;

    @OneToMany(() => Room, (room) => room.building)
    room?: Room[];
}
