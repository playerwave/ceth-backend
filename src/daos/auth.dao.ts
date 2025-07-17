// import { DataSource, Repository } from "typeorm";
// import { Users } from "../entity/users.entity";
// import { connectDatabase } from "../db/database";
// import { ErrorHandledDao } from "./error.handled.dao";

// export class AuthDao extends ErrorHandledDao {
//   private dataSource: DataSource | null = null;
//   private usersRepository: Repository<Users> | null = null;

//   constructor() {
//     super();
//     this.initialize();
//   }

//   private async initialize(): Promise<void> {
//     try {
//       this.dataSource = await connectDatabase();
//       this.usersRepository = this.dataSource.getRepository(Users);
//       console.log("✅ UsersDao initialized");
//     } catch (error) {
//       this.logDbError("initialize", error);
//     }
//   }

//   private checkConnection(): void {
//     if (!this.dataSource?.isInitialized || !this.usersRepository) {
//       throw new Error("❌ Users repository is not initialized");
//     }
//   }

//   public async register(username: string, password: string): Promise<void> {
//     this.checkConnection();
//     const roles = await this.usersRepository!.query(
//       `SELECT roles_id FROM roles WHERE roles_name::text LIKE '%Student%'`
//     );
//     if (roles.length === 0 || typeof roles[0].roles_id !== "number") {
//       throw new Error("Role 'Student' not found or invalid");
//     }
//     const roleId = roles[0].roles_id;
//     await this.usersRepository!.insert({
//       username,
//       password,
//       roles_id: roleId,
//     });
//   }

//   public async getUsersByUsername(username: string): Promise<Users[]> {
//     this.checkConnection();
//     return await this.usersRepository!.find({
//       where: { username },
//     });
//   }

//   public async getUsersById(users_id: number): Promise<Users[]> {
//     this.checkConnection();
//     return await this.usersRepository!.createQueryBuilder("users")
//       .innerJoinAndSelect("users.roles", "roles")
//       .where("users.users_id = :users_id", { users_id })
//       .getMany();
//   }

//   public async getIdByUsername(
//     username: string
//   ): Promise<{ users_id: number }[]> {
//     this.checkConnection();
//     return await this.usersRepository!.query(
//       `SELECT users_id FROM users WHERE username = $1`,
//       [username.trim()]
//     );
//   }
// }

import { DataSource, Repository } from "typeorm";
import { Users } from "../entity/users.entity";
import { connectDatabase } from "../db/database";
import { ErrorHandledDao } from "./error.handled.dao";

export class AuthDao extends ErrorHandledDao {
  private dataSource!: DataSource;
  private usersRepository!: Repository<Users>;

  constructor() {
    super();
    // สลับมาใช้ async/await ให้แน่นอนว่ามี repository ก่อนใช้งาน
    this.initialize().catch((err) => this.logDbError("initialize", err));
  }

  private async initialize(): Promise<void> {
    this.dataSource = await connectDatabase();
    this.usersRepository = this.dataSource.getRepository(Users);
    console.log("✅ AuthDao initialized");
  }

  private checkConnection(): void {
    if (!this.dataSource?.isInitialized || !this.usersRepository) {
      throw new Error("❌ Users repository is not initialized");
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
    this.checkConnection();
    await this.usersRepository.insert({
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
    this.checkConnection();
    return this.usersRepository
      .createQueryBuilder("users")
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
    this.checkConnection();
    return this.usersRepository
      .createQueryBuilder("users")
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
    this.checkConnection();
    return this.usersRepository.query(
      `SELECT users_id FROM users WHERE username = $1`,
      [username.trim()]
    );
  }
}
