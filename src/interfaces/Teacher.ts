export interface Teacher {
  teacher_id?: number;
  users_id: number; // FK ไปยัง Users.users_id
  first_name: string;
  last_name: string;
  faculty_id: number; // FK ไปยัง Faculty.faculty_id
}
