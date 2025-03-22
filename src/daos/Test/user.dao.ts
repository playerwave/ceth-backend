// import { connectDatabase } from "../../db/database";
// import { Repository } from "typeorm";
// import { Users } from "../../entity/Users";

// export class UsersDao {
//   private userRepository: Repository<Users> | null = null; // กำหนดค่าเริ่มต้นเป็น null

//   constructor() {
//     // ต้องรอให้การเชื่อมต่อฐานข้อมูลเสร็จสมบูรณ์ก่อน
//     connectDatabase()
//       .then((connection) => {
//         this.userRepository = connection.getRepository(Users);
//       })
//       .catch((error) => {
//         console.error("Database connection failed:", error);
//       });
//   }

//   async createUsers(
//     firstName: string,
//     lastName: string,
//     age: number
//   ): Promise<Users> {
//     if (!this.userRepository) {
//       throw new Error("Database connection is not established");
//     }
//     const user = this.userRepository.create({ firstName, lastName, age });
//     return await this.userRepository.save(user);
//   }

//   async getAllUserss(): Promise<Users[]> {
//     if (!this.userRepository) {
//       throw new Error("Database connection is not established");
//     }
//     return await this.userRepository.find({
//       order: {
//         id: "ASC", // หรือ "DESC" ขึ้นอยู่กับที่คุณต้องการ
//       },
//     });
//   }

//   async getUsersById(id: number): Promise<Users | null> {
//     if (!this.userRepository) {
//       throw new Error("Database connection is not established");
//     }
//     return await this.userRepository.findOne({ where: { id } });
//   }

//   async updateUsers(
//     id: number,
//     firstName: string,
//     lastName: string,
//     age: number
//   ): Promise<Users | null> {
//     if (!this.userRepository) {
//       throw new Error("Database connection is not established");
//     }
//     const user = await this.getUsersById(id);
//     if (user) {
//       user.firstName = firstName;
//       user.lastName = lastName;
//       user.age = age;
//       return await this.userRepository.save(user);
//     }
//     return null;
//   }

//   async patchUsers(id: number, userData: Partial<Users>): Promise<Users | null> {
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

//   async deleteUsers(id: number): Promise<void> {
//     if (!this.userRepository) {
//       throw new Error("Database connection is not established");
//     }
//     await this.userRepository.delete(id);
//   }
// }

