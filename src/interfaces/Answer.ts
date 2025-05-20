export interface Answer {
  answer_id?: number;           
  join_id: number;
  question_id: number;
  choice_id: number | null;     
  answer_text?: string | null;  
  set_number_id?: number | null;
  assessment_id?: number | null;
}
