import pool from "../../db/database";
import { Food } from "../../interfaces/Food";

export class FoodDao {
  async getAllFoods(): Promise<Food[]> {
    const { rows } = await pool.query(`SELECT * FROM food ORDER BY food_id`);
    return rows;
  }

  async getFoodById(food_id: number): Promise<Food | null> {
    const { rows } = await pool.query(`SELECT * FROM food WHERE food_id = $1`, [food_id]);
    return rows[0] || null;
  }
}
