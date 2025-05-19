import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Question } from './Question';
import { Answer } from './Answer';
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
