import pool from "../../db/database";
import { ActivityFood } from "../../interfaces/ActivityFood";

export class ActivityFoodDao {
  async getAllActivityFoods(): Promise<ActivityFood[]> {
    const { rows } = await pool.query(`SELECT * FROM activity_food ORDER BY activity_food_id`);
    return rows;
  }

  async getActivityFoodById(activity_food_id: number): Promise<ActivityFood | null> {
    const { rows } = await pool.query(`SELECT * FROM activity_food WHERE activity_food_id = $1`, [activity_food_id]);
    return rows[0] || null;
  }
}
