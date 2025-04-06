// ✅ auth.dao.ts
import { Repository } from "typeorm";
import { connectDatabase } from "../db/database";
import { User } from "../entity/User";
import logger from "../middleware/logger";

export class AuthDao {
  private userRepository: Repository<User> | null = null;

  constructor() {
    this.initializeRepository();
  }

  private async initializeRepository(): Promise<void> {
    try {
      const connection = await connectDatabase();
      this.userRepository = connection.getRepository(User);
      console.log("✅ User Repository initialized");
    } catch (error) {
      console.error("❌ Error initializing AuthDao:", error);
    }
  }

  private checkRepository(): void {
    if (!this.userRepository) {
      throw new Error("Database connection is not established");
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    console.log("login dao");
    this.checkRepository();
    try {
      console.log("dao: ", email);

      const result = await this.userRepository!.findOne({
        where: { u_email: email },
      });

      console.log(result);
      return result;
    } catch (error) {
      logger.error("❌ Error in findUserByEmail:", error);
      throw new Error("Failed to find user by email");
    }
  }

  async findUserById(id: string): Promise<User | null> {
    this.checkRepository();
    try {
      const result = await this.userRepository!.findOne({
        where: { u_id: Number(id) },
      });
      return result;
    } catch (error) {
      logger.error("❌ Error in findUserById:", error);
      throw new Error("Failed to find user by id");
    }
  }

  // async logout(): Promise<void> {
  //   // ถ้าอยาก log ว่ามีการ logout ก็ทำได้ตรงนี้
  //   console.log("📤 User logged out (DAO logic placeholder)");
  // }

  async logout(userId: number): Promise<void> {
    console.log(`📤 User with ID ${userId} has logged out.`);
    // future: บันทึกลง table log หรือ update last_logout ได้ที่นี่
  }
}
