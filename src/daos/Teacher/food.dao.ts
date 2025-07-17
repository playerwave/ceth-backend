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
      this.dataSource = await connectDatabase();
      console.log("✅ FoodDao initialized");
    } catch (error) {
      this.logDbError("initialize", error);
    }
  }

  private checkConnection(): void {
    if (!this.dataSource?.isInitialized) {
      throw new Error("❌ Database connection is not established");
    }
  }

  async countFood(): Promise<number> {
    this.checkConnection();
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
    this.checkConnection();
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
    this.checkConnection();
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
    this.checkConnection();
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
    this.checkConnection();
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
    this.checkConnection();

    const trimmedName = food_name.trim();
    const trimmedStatus = status.trim();
    const allowedStatuses = ["Active", "Inactive"];
    if (!allowedStatuses.includes(trimmedStatus)) {
      throw new Error(`❌ Invalid status value: ${trimmedStatus}`);
    }

    try {
      const result = await this.dataSource!.query(
        `
        INSERT INTO food (
          food_name, status, faculty_id
        ) VALUES ($1, $2, $3)
        RETURNING *`,
        [trimmedName, trimmedStatus, faculty_id]
      );

      return result[0]; // ✅ return object เดียว
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
    this.checkConnection();
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
    this.checkConnection();
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
    this.checkConnection();
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
    this.checkConnection();
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
