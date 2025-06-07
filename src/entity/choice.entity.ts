import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Question } from './question.entity';
import { Answer } from './answer.entity';
@Entity()
export class Choice {
    @PrimaryGeneratedColumn()
    choice_id!: number;

    @Column({ type: 'text' })
    choice_text?: string;

    @ManyToOne(() => Question, (question) => question.choice)
    @JoinColumn({ name: 'question_id' })
    question?: Question;

    @Column()
    question_id?: number;

    @OneToMany(() => Answer, (answer) => answer.choice)
    answer?: Answer[];
}