import pool from "../../db/database";
import { EventCoop } from "../../interfaces/EventCoop";

export class EventCoopDao {
  async getAllEventCoops(): Promise<EventCoop[]> {
    const { rows } = await pool.query(`SELECT * FROM eventcoop ORDER BY eventcoop_id`);
    return rows;
  }

  async getEventCoopById(eventcoop_id: number): Promise<EventCoop | null> {
    const { rows } = await pool.query(`SELECT * FROM eventcoop WHERE eventcoop_id = $1`, [eventcoop_id]);
    return rows[0] || null;
  }
}
