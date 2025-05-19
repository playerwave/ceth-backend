import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Students } from "./Students";
import { Department } from "./Department";
import { Teacher } from "./Teacher";
import { Building } from "./Building";
import { Food } from "./Food";
import { Room } from "./Room";
@Entity()
export class Faculty {
    @PrimaryGeneratedColumn()
    faculty_id!: number;

    @Column({ type: "varchar", length: 255, unique: true })
    faculty_name?: string;

    @OneToMany(() => Department, (department) => department.faculty)
    department!: Department[];

    @OneToMany(() => Building, (building) => building.faculty)
    building?: Building[];

    @OneToMany(() => Room, (room) => room.faculty)
    room?: Room[];

    @OneToMany(() => Food, (food) => food.faculty)
    food?: Food[];

    @OneToMany(() => Teacher, (teacher) => teacher.faculty)
    teacher?: Teacher[];

    @OneToMany(() => Students, (students) => students.faculty)
    students?: Students[];

}
