import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn
} from "typeorm";
import { Department } from "./Department";
import { Grade } from "./Grade";
import { Students } from "./Students";

@Entity()
export class EventCoop {
    @PrimaryGeneratedColumn()
    eventcoop_id!: number;

    @ManyToOne(() => Department, (department) => department.eventCoop)
    @JoinColumn({ name: 'department_id' })
    department!: Department;

    @Column()
    department_id!: number;

    @ManyToOne(() => Grade, (grade) => grade.eventCoop)
    @JoinColumn({ name: 'grade_id' })
    grade!: Grade;

    @Column()
    grade_id!: number;

    @Column({ type: "timestamp" })
    date?: Date;

    @OneToMany(() => Students, (students) => students.eventCoop)
    students!: Students[];
}
