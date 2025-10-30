import { AuthDao } from "../daos/auth.dao";
import { StudentsDao } from "../daos/Student/student.dao";
import { TeacherDao } from "../daos/Teacher/teacher.dao";
import { Users } from "../entity/users.entity";
import bcrypt from "bcryptjs";
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

  public async validateUser(
    username: string,
    password: string
  ): Promise<Users | null> {
    console.log(`🔍 [Auth] Validating user: ${username}`);
    const user = await this.authDao.getUsersByUsername(username);
    
    if (!user) {
      console.log(`❌ [Auth] User not found: ${username}`);
      return null;
    }
    
    if (!user.password) {
      console.log(`❌ [Auth] User has no password: ${username}`);
      return null;
    }

    console.log(`🔍 [Auth] Comparing passwords for user: ${username}`);
    const matched = await bcrypt.compare(password, user.password);
    console.log(`✅ [Auth] Password match result: ${matched} for user: ${username}`);
    
    return matched ? user : null;
  }


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

  /**
   * ตรวจสอบความแข็งแกร่งของรหัสผ่าน
   */
  public validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push("รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว");
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push("รหัสผ่านต้องมีตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว");
    }
    
    if (!/\d/.test(password)) {
      errors.push("รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว");
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\|;':"\/.,<>?]/.test(password)) {
      errors.push("รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว");
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * อัปเดตรหัสผ่านใหม่
   */
  public async updatePassword(
    userId: number,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      console.log("🔍 [AuthService] Starting password update for userId:", userId);
      console.log("🔍 [AuthService] New password length:", newPassword.length);
      
      // ตรวจสอบความแข็งแกร่งของรหัสผ่าน
      console.log("🔍 [AuthService] Validating password strength...");
      const validation = this.validatePasswordStrength(newPassword);
      console.log("🔍 [AuthService] Validation result:", validation);
      
      if (!validation.isValid) {
        console.log("❌ [AuthService] Password validation failed:", validation.errors);
        return {
          success: false,
          message: validation.errors.join(", ")
        };
      }

      // Hash รหัสผ่านใหม่
      console.log("🔍 [AuthService] Hashing new password...");
      const hashedPassword = await this.hashPassword(newPassword);
      console.log("🔍 [AuthService] Password hashed successfully, length:", hashedPassword.length);
      
      // อัปเดตในฐานข้อมูล
      console.log("🔍 [AuthService] Updating password in database...");
      await this.authDao.updatePassword(userId, hashedPassword);
      console.log("✅ [AuthService] Password updated in database successfully");
      
      return {
        success: true,
        message: "อัปเดตรหัสผ่านสำเร็จ"
      };
    } catch (error) {
      console.log("❌ [AuthService] Error in updatePassword:", error);
      this.logError("❌ Error in updatePassword", error);
      return {
        success: false,
        message: "เกิดข้อผิดพลาดในการอัปเดตรหัสผ่าน"
      };
    }
  }
}

export default AuthService;
