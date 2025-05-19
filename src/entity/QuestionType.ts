import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Question } from './Question';

@Entity()
export class QuestionType {
    @PrimaryGeneratedColumn()
    question_type_id!: number;

    @Column({
        type: 'enum',
        enum: ['Fix Single answer', 'Single answer', 'Multiple answer', 'Text answer'],
        unique: true,
    })
    question_name?: 'Fix Single answer' | 'Single answer' | 'Multiple answer' | 'Text answer';

    @OneToMany(() => Question, (question) => question.questionType)
    question?: Question[];
}
