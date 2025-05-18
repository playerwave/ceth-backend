import pool from "../../db/database";
import { Room } from "../../interfaces/Room";

export class RoomDao {
  async getAllRooms(): Promise<Room[]> {
    const { rows } = await pool.query(`SELECT * FROM room ORDER BY room_id`);
    return rows;
  }

  async getRoomById(room_id: number): Promise<Room | null> {
    const { rows } = await pool.query(`SELECT * FROM room WHERE room_id = $1`, [room_id]);
    return rows[0] || null;
  }
}
