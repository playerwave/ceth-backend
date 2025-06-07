import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Question } from './question.entity';
import { Assessment } from './assessment.entity';
import { Answer } from './answer.entity';
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