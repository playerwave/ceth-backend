export interface User {
  users_id?: number;
  username: string;
  password: string;
  roles_id: number; // FK ไปยัง Roles.roles_id
}
