export interface Students {
  students_id?: number;
  users_id: number; 
  first_name: string;
  last_name: string;
  email: string;
  risk_status: "Normal" | "Risk";
  education_status: "Studying" | "Graduate";
  soft_hours: number;
  hard_hours: number;
  faculty_id: number; 
  department_id: number; 
  grade_id: number; 
  eventcoop_id: number;
  status: "Active" | "InActive"; 
}
