import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('Event_Coop')
export class EventCoop {
  @PrimaryGeneratedColumn()
  e_id!: number;

  @Column({ type: 'varchar', length: 100 })
  e_department?: string;

  @Column({ type: 'int' })
  e_grade?: number;

  @Column({ type: 'timestamp' })
  e_date?: Date;
}
