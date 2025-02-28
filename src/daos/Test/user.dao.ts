// import { connectDatabase } from "../../db/database";
// import { Repository } from "typeorm";
// import { User } from "../../entity/User";

// export class UserDao {
//   private userRepository: Repository<User> | null = null; // กำหนดค่าเริ่มต้นเป็น null

//   constructor() {
//     // ต้องรอให้การเชื่อมต่อฐานข้อมูลเสร็จสมบูรณ์ก่อน
//     connectDatabase()
//       .then((connection) => {
//         this.userRepository = connection.getRepository(User);
//       })
//       .catch((error) => {
//         console.error("Database connection failed:", error);
//       });
//   }

//   async createUser(
//     firstName: string,
//     lastName: string,
//     age: number
//   ): Promise<User> {
//     if (!this.userRepository) {
//       throw new Error("Database connection is not established");
//     }
//     const user = this.userRepository.create({ firstName, lastName, age });
//     return await this.userRepository.save(user);
//   }

//   async getAllUsers(): Promise<User[]> {
//     if (!this.userRepository) {
//       throw new Error("Database connection is not established");
//     }
//     return await this.userRepository.find({
//       order: {
//         id: "ASC", // หรือ "DESC" ขึ้นอยู่กับที่คุณต้องการ
//       },
//     });
//   }

//   async getUserById(id: number): Promise<User | null> {
//     if (!this.userRepository) {
//       throw new Error("Database connection is not established");
//     }
//     return await this.userRepository.findOne({ where: { id } });
//   }

//   async updateUser(
//     id: number,
//     firstName: string,
//     lastName: string,
//     age: number
//   ): Promise<User | null> {
//     if (!this.userRepository) {
//       throw new Error("Database connection is not established");
//     }
//     const user = await this.getUserById(id);
//     if (user) {
//       user.firstName = firstName;
//       user.lastName = lastName;
//       user.age = age;
//       return await this.userRepository.save(user);
//     }
//     return null;
//   }

//   async patchUser(id: number, userData: Partial<User>): Promise<User | null> {
//     if (!this.userRepository) {
//       throw new Error("Database connection is not established");
//     }

//     // แก้ไขจาก findOneBy เป็น findOne และส่งพารามิเตอร์เป็น object
//     const user = await this.userRepository.findOne({ where: { id } });

//     if (!user) {
//       return null;
//     }

//     // อัปเดตเฉพาะฟิลด์ที่ได้รับ
//     if (userData.firstName) user.firstName = userData.firstName;
//     if (userData.lastName) user.lastName = userData.lastName;
//     if (userData.age !== undefined) user.age = userData.age;

//     return await this.userRepository.save(user);
//   }

//   async deleteUser(id: number): Promise<void> {
//     if (!this.userRepository) {
//       throw new Error("Database connection is not established");
//     }
//     await this.userRepository.delete(id);
//   }
// }
