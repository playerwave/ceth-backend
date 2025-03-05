import { AppDataSource } from "../../db/database";
import { Repository } from "typeorm";
import { User } from "../../entity/User";

export class UserDao {
  private userRepository: Repository<User>;

  constructor() {
    // ✅ ใช้ AppDataSource เพื่อดึง repository ของ User โดยตรง (TypeORM v0.3+)
    this.userRepository = AppDataSource.getRepository(User);
  }

  // ✅ สร้างผู้ใช้ใหม่
  async createUser(firstName: string, lastName: string, age: number): Promise<User> {
    const user = this.userRepository.create({ firstName, lastName, age }); // สร้าง instance ของ User
    return await this.userRepository.save(user); // บันทึกข้อมูลลงฐานข้อมูล
  }

  // ✅ ดึงข้อมูลผู้ใช้ทั้งหมด
  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.find({
      order: { id: "ASC" }, // เรียงลำดับจาก id น้อยไปมาก
    });
  }

  // ✅ ดึงข้อมูลผู้ใช้จาก ID
  async getUserById(id: number): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  // ✅ อัปเดตข้อมูลผู้ใช้โดยใช้ ID
  async updateUser(id: number, firstName: string, lastName: string, age: number): Promise<User | null> {
    const user = await this.getUserById(id);
    if (!user) return null; // ถ้าหาไม่เจอให้คืนค่า null
    Object.assign(user, { firstName, lastName, age }); // อัปเดตข้อมูลที่เปลี่ยนแปลง
    return await this.userRepository.save(user); // บันทึกข้อมูลที่อัปเดตลงฐานข้อมูล
  }

  // ✅ อัปเดตข้อมูลบางส่วนของผู้ใช้
  async patchUser(id: number, userData: Partial<User>): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) return null; // ถ้าหาไม่เจอให้คืนค่า null
    Object.assign(user, userData); // อัปเดตเฉพาะข้อมูลที่ส่งมา
    return await this.userRepository.save(user);
  }

  // ✅ ลบผู้ใช้จากฐานข้อมูล
  async deleteUser(id: number): Promise<boolean> {
    const result = await this.userRepository.delete(id);
    return result.affected !== 0; // คืนค่า true ถ้าลบสำเร็จ, false ถ้าไม่พบข้อมูล
  }
}
