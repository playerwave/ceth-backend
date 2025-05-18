export interface Students {
  students_id?: number;
  users_id: number; // FK ไปยัง Users.users_id
  first_name: string;
  last_name: string;
  email: string;
  risk_status: "Normal" | "Risk";
  education_status: "Studying" | "Graduate";
  soft_hours: number;
  hard_hours: number;
  faculty_id: number; // FK ไปยัง Faculty.faculty_id
  department_id: number; // FK ไปยัง Department.department_id
  grade_id: number; // FK ไปยัง Grade.grade_id
  eventcoop_id: number; // FK ไปยัง EventCoop.eventcoop_id
}
