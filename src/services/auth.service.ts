import { AuthDao } from "../daos/auth.dao";
import { StudentsDao } from "../daos/Student/student.dao";
import { TeacherDao } from "../daos/Teacher/teacher.dao";
import { Users } from "../entity/users.entity";
import bcrypt from "bcrypt";
import redis from "../config/redis";
import { ErrorHandledService } from "./error.handdled.service";

export class AuthService extends ErrorHandledService {
  // กำหนด default roleId (เช่น สถานะ Student)
  private readonly defaultRoleId = 2;

  constructor(
    private readonly authDao: AuthDao = new AuthDao(),
    private readonly studentsDao: StudentsDao = new StudentsDao(),
    private readonly teacherDao: TeacherDao = new TeacherDao()
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
  // public async validateUser(
  //   username: string,
  //   password: string
  // ): Promise<Users | null> {
  //   const rows = await this.authDao.getUsersByUsername(username);
  //   if (!rows.length) return null;

  //   const user = rows[0];
  //   if (!user.password) return null;

  //   const matched = await bcrypt.compare(password, user.password);
  //   return matched ? user : null;
  // }

  public async validateUser(
    username: string,
    password: string
  ): Promise<Users | null> {
    const user = await this.authDao.getUsersByUsername(username);
    if (!user || !user.password) return null;

    const matched = await bcrypt.compare(password, user.password);
    return matched ? user : null;
  }

  /**
   * ดึงข้อมูลผู้ใช้ตาม ID
   */
  // public async findById(userId: number): Promise<Users | null> {
  //   const rows = await this.authDao.getUsersById(userId);
  //   return rows.length ? rows[0] : null;
  // }

  public async findById(userId: number): Promise<Users | null> {
    return await this.authDao.getUsersById(userId); // ✅ ไม่เปลี่ยนชื่อเหมือนเดิมเป๊ะ!
  }

  /**
   * ดึงข้อมูล Student ตาม users_id
   */
  public async getStudentData(userId: number): Promise<any | null> {
    try {
      return await this.studentsDao.getStudentByUserId(userId);
    } catch (error) {
      this.logError("❌ Error in getStudentData", error);
      return null;
    }
  }

  /**
   * ดึงข้อมูล Teacher ตาม users_id
   */
  public async getTeacherData(userId: number): Promise<any | null> {
    try {
      return await this.teacherDao.getTeacherByUserId(userId);
    } catch (error) {
      this.logError("❌ Error in getTeacherData", error);
      return null;
    }
  }

  /*** helper functions ***/

  // private async existsUsername(username: string): Promise<boolean> {
  //   const rows = await this.authDao.getUsersByUsername(username);
  //   return rows.length > 0;
  // }

  private async existsUsername(username: string): Promise<boolean> {
    const user = await this.authDao.getUsersByUsername(username);
    return user !== null;
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
