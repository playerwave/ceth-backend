import { DataSource, Repository } from "typeorm";
import { Users } from "../entity/users.entity";
import { connectDatabase } from "../db/database";
import { ErrorHandledDao } from "./error.handled.dao";

export class AuthDao extends ErrorHandledDao {
  private dataSource: DataSource | null = null;
  private usersRepository: Repository<Users> | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.dataSource = await connectDatabase();
      this.usersRepository = this.dataSource.getRepository(Users);
      console.log("✅ UsersDao initialized");
    } catch (error) {
      this.logDbError("initialize", error);
    }
  }

  private checkConnection(): void {
    if (!this.dataSource?.isInitialized || !this.usersRepository) {
      throw new Error("❌ Users repository is not initialized");
    }
  }

  public async register(username: string, password: string): Promise<void> {
    this.checkConnection();
    const roles = await this.usersRepository!.query(
      `SELECT roles_id FROM roles WHERE roles_name::text LIKE '%Student%'`
    );
    if (roles.length === 0 || typeof roles[0].roles_id !== "number") {
      throw new Error("Role 'Student' not found or invalid");
    }
    const roleId = roles[0].roles_id;
    await this.usersRepository!.insert({
      username,
      password,
      roles_id: roleId,
    });
  }

  public async getUsersByUsername(username: string): Promise<Users[]> {
    this.checkConnection();
    return await this.usersRepository!.find({
      where: { username },
    });
  }

  public async getUsersById(users_id: number): Promise<Users[]> {
    this.checkConnection();
    return await this.usersRepository!.createQueryBuilder("users")
      .innerJoinAndSelect("users.roles", "roles")
      .where("users.users_id = :users_id", { users_id })
      .getMany();
  }

  public async getIdByUsername(
    username: string
  ): Promise<{ users_id: number }[]> {
    this.checkConnection();
    return await this.usersRepository!.query(
      `SELECT users_id FROM users WHERE username = $1`,
      [username.trim()]
    );
  }
}
