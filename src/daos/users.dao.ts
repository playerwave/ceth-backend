import { Repository } from "typeorm";
import { Users } from "../entity/Users";
import { connectDatabase } from "../database/database";

export class UsersDao {
  private usersRepository: Repository<Users> | null = null;

  constructor() {
    connectDatabase()
      .then((connection) => {
        this.usersRepository = connection.getRepository(Users);
      })
      .catch((error) => {
        console.error("Database connection failed:", error);
      });
  }

  async getUsers(): Promise<Users[]> {
    if (!this.usersRepository) {
      throw new Error("Repository is not initialized");
    }
    try {
      const sql = `SELECT users.*, roles.roles_name FROM users INNER JOIN roles ON users.roles_id = roles.roles_id ORDER BY users.users_id ASC`;
      const result = await this.usersRepository.query(sql);
      return result;
    } catch (error) {
      throw new Error(`Error from Users Dao Function -> getUsers : ${error}`);
    }
  }


  async getUsersname(username: string): Promise<Users[]> {
    if (!this.usersRepository) {
      throw new Error("Repository is not initialized");
    }
    try {
      const sql = `SELECT * FROM users WHERE username = $1`;
      const result = await this.usersRepository.query(sql, [username]);
      return result;
    } catch (error) {
      throw new Error(`Error form Users Dao Function -> getUsers : ${error}`);
    }
  }

  async getUserByID(users_id: number): Promise<Users[]> {
    if (!this.usersRepository) {
      throw new Error("Repository is not initialized");
    }
    try {
      const sql = `SELECT users.*, roles.* FROM users INNER JOIN roles ON users.roles_id = roles.roles_id WHERE users.users_id = $1`;
      const result = await this.usersRepository.query(sql, [users_id]);
      return result;
    } catch (error) {
      throw new Error(`Error form Users Dao Function -> getUsers : ${error}`);
    }
  }

  async addUsers(username: string, password: string): Promise<Users[]> {
    if (!this.usersRepository) {
      throw new Error("Repository is not initialized");
    }
    try {
      const roleStudent = `SELECT roles_id FROM roles WHERE roles_name::text LIKE '%Student%'`;
      const roleResult = await this.usersRepository.query(roleStudent)
      if (roleResult.length === 0) {
        throw new Error("Role 'Student' not found");
      }
      const roles_id = roleResult[0].roles_id

      const sql = `INSERT INTO users (username, password, roles_id) VALUES ($1, $2, $3)`;
      const result = await this.usersRepository.query(sql, [username, password, roles_id]);
      return result;
    } catch (error) {
      throw new Error(`Error form Users Dao Function -> addUsers : ${error}`);
    }
  }

  async rolesAdmin(): Promise<Users[]> {
    if (!this.usersRepository) {
      throw new Error("Repository is not initialized");
    } try {
      const sql = `SELECT roles_id FROM roles WHERE roles_name::text LIKE '%Admin%'`
      const result = await this.usersRepository.query(sql)
      return result
    } catch (error) {
      throw new Error(`Error form Users Dao Function -> rolesAdmin : ${error}`);
    }
  }
}
