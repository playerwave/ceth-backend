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
      console.log("🔄 Initializing AuthDao...");
      this.dataSource = await connectDatabase();
      this.usersRepository = this.dataSource.getRepository(Users);
      console.log("✅ AuthDao initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize AuthDao:", error);
      this.logDbError("initialize", error);
      throw error; // Re-throw เพื่อให้ caller รู้ว่ามีปัญหา
    }
  }

  private async checkConnection(): Promise<void> {
    if (!this.dataSource?.isInitialized || !this.usersRepository) {
      console.log("🔄 Repository not initialized, attempting to initialize...");
      try {
        await this.initialize();
      } catch (error) {
        throw new Error(`❌ Users repository is not initialized: ${error}`);
      }
    }

    // ตรวจสอบว่า connection ยังใช้งานได้อยู่
    if (!this.dataSource?.isConnected) {
      throw new Error("❌ Database connection is not active");
    }
  }

  /**
   * ลงทะเบียนผู้ใช้ใหม่
   * @param username ชื่อผู้ใช้
   * @param password รหัสผ่านที่ผ่านการ hash แล้ว
   * @param roles_id รหัส role (มาจาก controller/service)
   */
  public async register(
    username: string,
    password: string,
    roles_id: number
  ): Promise<void> {
    await this.checkConnection();
    await this.usersRepository!.insert({
      username: username.trim(),
      password,
      roles_id,
    });
  }

  /**
   * ดึงข้อมูลผู้ใช้ตาม username (สำหรับ validateUser)
   */
  // public async getUsersByUsername(username: string): Promise<Users[]> {
  //   this.checkConnection();
  //   return this.usersRepository.find({
  //     where: { username: username.trim() },
  //   });
  // }

  public async getUsersByUsername(username: string): Promise<Users | null> {
    await this.checkConnection();
    return this.usersRepository!.createQueryBuilder("users")
      .innerJoinAndSelect("users.roles", "roles") // ✅ JOIN roles → ดึง role_name ได้
      .where("users.username = :username", { username: username.trim() })
      .select([
        "users.users_id",
        "users.username",
        "users.password",
        "users.roles_id",
        "roles.roles_id",
        "roles.roles_name",
      ])
      .getOne(); // ✅ return แค่คนเดียว
  }

  /**
   * ดึงข้อมูลผู้ใช้ตาม ID (สำหรับ findById)
   */
  // public async getUsersById(users_id: number): Promise<Users[]> {
  //   this.checkConnection();
  //   return this.usersRepository
  //     .createQueryBuilder("users")
  //     .innerJoinAndSelect("users.roles", "roles")
  //     .where("users.users_id = :users_id", { users_id })
  //     .getMany();
  // }

  public async getUsersById(users_id: number): Promise<Users | null> {
    await this.checkConnection();
    return this.usersRepository!.createQueryBuilder("users")
      .innerJoinAndSelect("users.roles", "roles") // ✅ JOIN ให้ได้ roles.role_name
      .where("users.users_id = :users_id", { users_id })
      .getOne(); // ✅ return คนเดียวเท่านั้น
  }

  /**
   * ดึงเฉพาะ ID ของผู้ใช้ตาม username
   * (ใช้ใน service.getUserId)
   */
  public async getIdByUsername(
    username: string
  ): Promise<{ users_id: number }[]> {
    await this.checkConnection();
    return this.usersRepository!.query(
      `SELECT users_id FROM users WHERE username = $1`,
      [username.trim()]
    );
  }

  /**
   * อัปเดตรหัสผ่านใหม่
   * @param userId รหัสผู้ใช้
   * @param hashedPassword รหัสผ่านที่ผ่านการ hash แล้ว
   */
  public async updatePassword(
    userId: number,
    hashedPassword: string
  ): Promise<void> {
    console.log("🔍 [AuthDao] Starting password update for userId:", userId);
    console.log("🔍 [AuthDao] Hashed password length:", hashedPassword.length);
    
    await this.checkConnection();
    console.log("🔍 [AuthDao] Database connection verified");
    
    try {
      console.log("🔍 [AuthDao] Executing database update...");
      const result = await this.usersRepository!.update(
        { users_id: userId },
        { password: hashedPassword }
      );
      console.log("🔍 [AuthDao] Update result:", result);
      console.log("✅ [AuthDao] Password updated successfully in database");
    } catch (error) {
      console.log("❌ [AuthDao] Error updating password:", error);
      throw error;
    }
  }
}
