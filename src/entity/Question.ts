import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { QuestionType } from './QuestionType';
import { SetNumber } from './SetNumber';
import { Choice } from './Choice';
import { Answer } from './Answer';
@Entity()
export class Question {
    @PrimaryGeneratedColumn()
    question_id!: number;

    @Column({ type: 'text' })
    question_text!: string;

    @ManyToOne(() => QuestionType, (questionType) => questionType.question)
    @JoinColumn({ name: 'question_type_id' })
    questionType!: QuestionType;

    @Column()
    question_type_id?: number;

    @Column({ type: 'int' })
    question_number?: number;

    @ManyToOne(() => SetNumber, (setNumber) => setNumber.question)
    @JoinColumn({ name: 'set_number_id' })
    setNumber?: SetNumber;

    @Column()
    set_number_id?: number;

    @OneToMany(() => Choice, (choice) => choice.question)
    choice?: Choice[];

    @OneToMany(() => Answer, (answer) => answer.question)
    answer?: Answer[];
}
