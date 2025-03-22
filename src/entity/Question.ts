import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('question')
export class Question {
  @PrimaryGeneratedColumn()
  q_id!: number;

  @Column({ type: 'varchar', length: 100 })
  q_type?: string;

  @Column({ type: 'varchar', length: 100 })
  q_answer?: string;
}
