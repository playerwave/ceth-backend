import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Students } from "./students.entity";
import { Department } from "./department.entity";
import { Teacher } from "./teacher.entity";
import { Building } from "./building.entity";
import { Food } from "./food.entity";
import { Room } from "./room.entity";
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