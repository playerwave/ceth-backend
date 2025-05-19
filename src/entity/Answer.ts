import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Join } from './Join';
import { Question } from './Question';
import { Choice } from './Choice';
import { SetNumber } from './SetNumber';
import { Assessment } from './Assessment';

@Entity()
export class Answer {
    @PrimaryGeneratedColumn()
    answer_id!: number;

    @ManyToOne(() => Join, (join) => join.answer)
    @JoinColumn({ name: 'join_id' })
    join?: Join;

    @Column()
    join_id?: number;

    @ManyToOne(() => Question, (question) => question.answer)
    @JoinColumn({ name: 'question_id' })
    question?: Question;

    @Column()
    question_id?: number;

    @ManyToOne(() => Choice, (choice) => choice.answer, { nullable: true })
    @JoinColumn({ name: 'choice_id' })
    choice?: Choice | null;

    @Column()
    choice_id?: number;

    @Column({ type: 'text', nullable: true })
    answer_text?: string | null;

    @ManyToOne(() => SetNumber, (setNumber) => setNumber.answer)
    @JoinColumn({ name: 'set_number_id' })
    setNumber!: SetNumber;

    @Column()
    set_number_id?: number;

    @ManyToOne(() => Assessment, (assessment) => assessment.answer)
    @JoinColumn({ name: 'assessment_id' })
    assessment?: Assessment;

    @Column()
    assessment_id?: number;
}
