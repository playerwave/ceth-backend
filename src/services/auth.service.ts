// import { AuthDao } from "../daos/auth.dao";
// import { StudentsDao } from "../daos/Student/student.dao";
// import { Users } from "../entity/users.entity";
// import redis from "../config/redis";
// import bcrypt from "bcrypt";
// import passport from "passport";
// import { Strategy as LocalStrategy } from "passport-local";
// import { ErrorHandledService } from "./error.handdled.service";

// declare global {
//   namespace Express {
//     interface User {
//       users_id: number;
//     }
//   }
// }

// export interface PassportUser {
//   users_id: number;
// }

// export class AuthService extends ErrorHandledService {
//   constructor(
//     private readonly authDao: AuthDao = new AuthDao(),
//     private readonly studentsDao: StudentsDao = new StudentsDao()
//   ) {
//     super();
//   }

//   public async register(username: string, password: string): Promise<boolean> {
//     if (await this.existsUsername(username)) return false;
//     const hash = await this.hashPassword(password);

//     await this.authDao.register(username, hash);
//     const userId = await this.getUserId(username);
//     if (userId === null) return false;

//     await this.studentsDao.add(userId);
//     try {
//       await redis.del("users:all");
//     } catch (err) {
//       console.error("Redis delete error for users:all:", err);
//     }
//     return true;
//   }

//   public initializePassport(): void {
//     passport.use(
//       "local",
//       new LocalStrategy(
//         async (
//           username: string,
//           password: string,
//           done: (
//             error: Error | null,
//             user?: Users | false,
//             info?: { message: string }
//           ) => void
//         ) => {
//           try {
//             const findUsername = await this.authDao.getUsersByUsername(
//               username
//             );
//             if (!findUsername.length) {
//               return done(null, false, { message: "ไม่มีชื่อผู้ใช้นี้" });
//             }

//             const user = findUsername[0];
//             if (!user.password) {
//               return done(null, false, { message: "ไม่พบรหัสผ่าน" });
//             }

//             const result = await bcrypt.compare(password, user.password);
//             return done(null, result ? user : false);
//           } catch (error) {
//             return done(
//               error instanceof Error
//                 ? error
//                 : new Error(`Error from passport local login: ${error}`)
//             );
//           }
//         }
//       )
//     );

//     passport.serializeUser(
//       (user: Users, done: (err: Error | null, id?: number) => void) => {
//         done(null, user.users_id);
//       }
//     );

//     passport.deserializeUser(
//       async (
//         id: number,
//         done: (err: Error | null, user?: Users | false | null) => void
//       ) => {
//         try {
//           const userData = await this.authDao.getUsersById(id);
//           if (!userData.length) return done(null, false);
//           done(null, userData[0]);
//         } catch (err) {
//           done(
//             err instanceof Error
//               ? err
//               : new Error(`Error in deserializeUser: ${err}`)
//           );
//         }
//       }
//     );
//   }

//   private async existsUsername(username: string): Promise<boolean> {
//     const found = await this.authDao.getUsersByUsername(username);
//     return found.length > 0;
//   }

//   private async getUserId(username: string): Promise<number | null> {
//     const found = await this.authDao.getIdByUsername(username);
//     const id = found[0]?.users_id;
//     return typeof id === "number" && !isNaN(id) ? id : null;
//   }

//   private async hashPassword(password: string): Promise<string> {
//     const saltRounds = 10;
//     return await bcrypt.hash(password, saltRounds);
//   }
// }

// src/services/auth.service.ts
import { AuthDao } from "../daos/auth.dao";
import { StudentsDao } from "../daos/Student/student.dao";
import { Users } from "../entity/users.entity";
import bcrypt from "bcrypt";
import redis from "../config/redis";
import { ErrorHandledService } from "./error.handdled.service";

export class AuthService extends ErrorHandledService {
  // กำหนด default roleId (เช่น สถานะ Student)
  private readonly defaultRoleId = 2;

  constructor(
    private readonly authDao: AuthDao = new AuthDao(),
    private readonly studentsDao: StudentsDao = new StudentsDao()
  ) {
    super();
  }

  /**
   * ลงทะเบียนผู้ใช้ใหม่
   * controller จะเรียกแค่ (username, password)
   * แต่สามารถส่ง roles_id เพิ่มได้ถ้าต้องการ override
   */
  public async register(
    username: string,
    password: string,
    roles_id?: number
  ): Promise<boolean> {
    // 1. เช็คซ้ำ
    if (await this.existsUsername(username)) return false;

    // 2. ทำ hash รหัสผ่าน
    const hash = await this.hashPassword(password);

    // 3. เลือก roles_id (ใช้ default ถ้าไม่ส่งมา)
    const roleId = roles_id ?? this.defaultRoleId;
    await this.authDao.register(username, hash, roleId);

    // 4. ถ้าเป็น student (defaultRole) ให้ใส่ profile ในตาราง student
    if (roleId === this.defaultRoleId) {
      const userId = await this.getUserId(username);
      if (userId !== null) {
        await this.studentsDao.add(userId);
      }
    }

    // 5. เคลียร์ cache users:all
    try {
      await redis.del("users:all");
    } catch (err) {
      console.error("Redis delete error:", err);
    }

    return true;
  }

  /**
   * ตรวจสอบ credential
   * คืน Users object ถ้าถูกต้อง, หรือ null ถ้าไม่ถูก
   */
  public async validateUser(
    username: string,
    password: string
  ): Promise<Users | null> {
    const rows = await this.authDao.getUsersByUsername(username);
    if (!rows.length) return null;

    const user = rows[0];
    if (!user.password) return null;

    const matched = await bcrypt.compare(password, user.password);
    return matched ? user : null;
  }

  /**
   * ดึงข้อมูลผู้ใช้ตาม ID
   */
  public async findById(userId: number): Promise<Users | null> {
    const rows = await this.authDao.getUsersById(userId);
    return rows.length ? rows[0] : null;
  }

  /*** helper functions ***/

  private async existsUsername(username: string): Promise<boolean> {
    const rows = await this.authDao.getUsersByUsername(username);
    return rows.length > 0;
  }

  private async getUserId(username: string): Promise<number | null> {
    const rows = await this.authDao.getIdByUsername(username);
    const id = rows[0]?.users_id;
    return typeof id === "number" ? id : null;
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }
}

export default AuthService;
