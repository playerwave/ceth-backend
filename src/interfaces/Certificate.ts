export interface Certificate {
  certificate_id?: number;
  students_id: number;
  teacher_id: number;
  activity_id: number;
  date: Date;
  hours: number;
  img: string;
  status: "Pending" | "Pass" | "Fail";
}
