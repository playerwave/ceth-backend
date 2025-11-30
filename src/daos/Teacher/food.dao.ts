import { DataSource } from "typeorm";
import { Food } from "../../entity/food.entity";
import { connectDatabase } from "../../db/database";
import { ErrorHandledDao } from "../error.handled.dao";

export class FoodDao extends ErrorHandledDao {
  private dataSource: DataSource | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      console.log("🔄 Initializing FoodDao...");
      this.dataSource = await connectDatabase();
      console.log("✅ FoodDao initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize FoodDao:", error);
      this.logDbError("initialize", error);
      throw error;
    }
  }

  private async checkConnection(): Promise<void> {
    if (!this.dataSource?.isConnected) {
      console.log(
        "🔄 Database connection not established, attempting to initialize..."
      );
      try {
        await this.initialize();
      } catch (error) {
        throw new Error(`❌ Database connection is not established: ${error}`);
      }
    }
  }

  async countFood(): Promise<number> {
    await this.checkConnection();
    try {
      const result = await this.dataSource!.query("SELECT COUNT(*) FROM food");
      return Number(result[0].count);
    } catch (error) {
      this.logDbError("countFood", error);
      throw error;
    }
  }

  // async getFood(page: number, limit: number): Promise<Food[]> {
  //   this.checkConnection();
  //   try {
  //     const offset = (page - 1) * limit;
  //     const result = await this.dataSource!.query(
  //       "SELECT * FROM food ORDER BY food_id ASC LIMIT $1 OFFSET $2",
  //       [limit, offset]
  //     );
  //     return result;
  //   } catch (error) {
  //     this.logDbError("getFood", error);
  //     throw error;
  //   }
  // }

  async getFood(page: number, limit: number): Promise<Food[]> {
    await this.checkConnection();
    const offset = (page - 1) * limit;

    const result = await this.dataSource!.query(
      `SELECT 
     f.food_id,
     f.food_name,
     f.status,
     f.faculty_id,
     COALESCE(fc.faculty_name, '') AS faculty_name
   FROM food f
   LEFT JOIN faculty fc ON fc.faculty_id = f.faculty_id
   ORDER BY f.food_id ASC
   LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result;
  }

  async getFoodByID(food_id: number): Promise<Food[]> {
    await this.checkConnection();
    try {
      return await this.dataSource!.query(
        "SELECT * FROM food WHERE food_id = $1",
        [food_id]
      );
    } catch (error) {
      this.logDbError("getFoodByID", error);
      throw error;
    }
  }

  async getFoodByName(food_name: string): Promise<Food[]> {
    await this.checkConnection();
    try {
      return await this.dataSource!.query(
        "SELECT * FROM food WHERE food_name = $1",
        [food_name.trim()]
      );
    } catch (error) {
      this.logDbError("getFoodByName", error);
      throw error;
    }
  }

  async getFoodIDByFacultyID(faculty_id: number): Promise<Food[]> {
    await this.checkConnection();
    try {
      return await this.dataSource!.query(
        "SELECT * FROM food WHERE faculty_id = $1",
        [faculty_id]
      );
    } catch (error) {
      this.logDbError("getFoodIDByFacultyID", error);
      throw error;
    }
  }

  async addFood(
    food_name: string,
    status: string,
    faculty_id: number
  ): Promise<Food> {
    await this.checkConnection();

    const trimmedName = food_name.trim();
    const trimmedStatus = status.trim();
    const allowedStatuses = ["Active", "Inactive"];
    if (!allowedStatuses.includes(trimmedStatus)) {
      throw new Error(`❌ Invalid status value: ${trimmedStatus}`);
    }

    try {
      // ✅ ใช้ TypeORM Repository แทน raw query (TypeORM จะจัดการ sequence ให้อัตโนมัติ)
      const foodRepository = this.dataSource!.getRepository(Food);
      
      // สร้าง entity object
      const newFood = foodRepository.create({
        food_name: trimmedName,
        status: trimmedStatus as "Active" | "Inactive",
        faculty_id: faculty_id
      });
      
      // บันทึก (TypeORM จะจัดการ sequence ให้อัตโนมัติ)
      const savedFood = await foodRepository.save(newFood);
      
      console.log(`✅ [addFood] Food created successfully with food_id: ${savedFood.food_id}`);
      return savedFood;
    } catch (error) {
      this.logDbError("addFood", error);
      throw error;
    }
  }

  async updatedFoodByName(
    food_id: number,
    food_name: string,
    status: string,
    faculty_id: number
  ): Promise<Food | null> {
    await this.checkConnection();
    const trimmedName = food_name.trim();
    const trimmedStatus = status.trim();

    try {
      const result = await this.dataSource!.query(
        `
        UPDATE food SET 
          food_name = $1,
          status = $2,
          faculty_id = $3
        WHERE food_id = $4
        RETURNING *`,
        [trimmedName, trimmedStatus, faculty_id, food_id]
      );

      return result[0] || null;
    } catch (error) {
      this.logDbError("updatedFoodByName", error);
      throw error;
    }
  }

  async updatedFoodByNotName(
    food_id: number,
    status: string,
    faculty_id: number
  ): Promise<void> {
    await this.checkConnection();
    try {
      await this.dataSource!.query(
        `
        UPDATE food SET
          status = $1,
          faculty_id = $2
        WHERE food_id = $3`,
        [status.trim(), faculty_id, food_id]
      );
    } catch (error) {
      this.logDbError("updatedFoodByNotName", error);
      throw error;
    }
  }

  async deletedFood(food_id: number): Promise<Food | null> {
    await this.checkConnection();
    try {
      const result = await this.dataSource!.query(
        "DELETE FROM food WHERE food_id = $1 RETURNING *",
        [food_id]
      );
      return result[0] || null;
    } catch (error) {
      this.logDbError("deletedFood", error);
      throw error;
    }
  }

  async deletedFoodByFacultyID(faculty_id: number): Promise<void> {
    await this.checkConnection();
    try {
      await this.dataSource!.query("DELETE FROM food WHERE faculty_id = $1", [
        faculty_id,
      ]);
    } catch (error) {
      this.logDbError("deletedFoodByFacultyID", error);
      throw error;
    }
  }
}
