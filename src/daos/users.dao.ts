import { DataSource, Repository } from "typeorm";
import { Users } from "../entity/users.entity";
import { connectDatabase } from "../db/database";
import { ErrorHandledDao } from "./error.handled.dao";

export class UsersDao extends ErrorHandledDao {
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

  public async countUsers(): Promise<number> {
    this.checkConnection();
    return await this.usersRepository!.count();
  }

  public async getUsers(page: number, limit: number): Promise<Users[]> {
    this.checkConnection();
    const offset = (page - 1) * limit;
    return await this.usersRepository!.createQueryBuilder("users")
      .innerJoinAndSelect("users.roles", "roles")
      .orderBy("users.users_id", "ASC")
      .skip(offset)
      .take(limit)
      .getMany();
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

  public async getRolesIdByUsersId(
    users_id: number
  ): Promise<{ roles_id: number }[]> {
    this.checkConnection();
    return await this.usersRepository!.query(
      `SELECT roles_id FROM users WHERE users_id = $1`,
      [users_id]
    );
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

  public async addUsers(
    username: string,
    password: string,
    roles_id: number
  ): Promise<Users> {
    this.checkConnection();
    const result = await this.usersRepository!.createQueryBuilder()
      .insert()
      .into(Users)
      .values({ username, password, roles_id })
      .returning("*")
      .execute();

    return result.raw[0]; // ✅ ให้แน่ชัดว่าคืน Users
  }

  public async updatedUsers(
    users_id: number,
    username: string,
    roles_id: number
  ): Promise<Users | null> {
    this.checkConnection();

    // อัปเดตข้อมูล
    await this.usersRepository!.update(users_id, {
      username: username.trim(),
      roles_id,
    });

    // ดึงข้อมูลล่าสุดกลับมา
    const updated = await this.usersRepository!.findOne({
      where: { users_id },
    });

    return updated || null;
  }

  public async updatedRoles(users_id: number, roles_id: number): Promise<void> {
    this.checkConnection();
    await this.usersRepository!.update(users_id, { roles_id });
  }

  public async updatedPasswordByUsers(
    users_id: number,
    password: string
  ): Promise<void> {
    this.checkConnection();
    await this.usersRepository!.update(users_id, { password });
  }

  public async deleteUsers(users_id: number): Promise<void> {
    this.checkConnection();
    await this.usersRepository!.delete(users_id);
  }

  public async rolesAdmin(): Promise<Users[]> {
    this.checkConnection();
    return await this.usersRepository!.createQueryBuilder("users")
      .innerJoinAndSelect("users.roles", "roles")
      // .where("roles.roles_name ILIKE :name", { name: "%Admin%" })
      .where("CAST(roles.roles_name AS text) ILIKE :name", { name: "%Admin%" })

      .getMany();
  }
}
