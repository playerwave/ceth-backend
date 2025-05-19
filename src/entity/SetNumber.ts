import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Question } from './Question';
import { Assessment } from './Assessment';
import { Answer } from './Answer';
@Entity()
export class SetNumber {
    @PrimaryGeneratedColumn()
    set_number_id!: number;

    @Column({ type: 'varchar', length: 255 })
    name?: string;

    @Column({
        type: 'enum',
        enum: ['Active', 'Inactive'],
        default: 'Active',
    })
    status?: 'Active' | 'Inactive';

    @OneToMany(() => Question, (question) => question.setNumber)
    question?: Question[];

    @OneToMany(() => Assessment, (assessment) => assessment.setNumber)
    assessment?: Assessment[];

    @OneToMany(() => Answer, (answer) => answer.setNumber)
    answer?: Answer[];
}
