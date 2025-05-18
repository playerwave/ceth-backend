import pool from "../../db/database";
import { Building } from "../../interfaces/Building";

export class BuildingDao {
  async getAllBuildings(): Promise<Building[]> {
    const { rows } = await pool.query(`SELECT * FROM building ORDER BY building_id`);
    return rows;
  }

  async getBuildingById(building_id: number): Promise<Building | null> {
    const { rows } = await pool.query(`SELECT * FROM building WHERE building_id = $1`, [building_id]);
    return rows[0] || null;
  }
}
