export interface Join {
  join_id?: number;
  students_id: number;
  teacher_id: number;
  join_date: Date;
  status: "Pending" | "Completed" | "Cancelled";
  activity_detail_id: number;
}
