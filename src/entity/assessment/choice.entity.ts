import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Question } from './question.entity';
import { Answer } from './answer.entity';

@Entity({ name: 'choice' })
export class Choice {
    @PrimaryGeneratedColumn()
    choice_id!: number;

    @Column({ type: 'text', nullable: true })
    choice_text?: string | null;

    @ManyToOne(() => Question, (question) => question.choice, { nullable: false })
    @JoinColumn({ name: 'question_id' })
    question!: Question;

    @Column({ name: 'choice_number', type: 'int', nullable: true })
    choice_number?: number | null;

    @OneToMany(() => Answer, (answer) => answer.choice)
    answer?: Answer[];
}