// src/daos/Teacher/room.dao.ts
import { DataSource, Repository } from "typeorm";
import { Room } from "../../entity/room.entity";
import { connectDatabase } from "../../db/database";
import { ErrorHandledDao } from "../error.handled.dao";

export class RoomDao extends ErrorHandledDao {
  private dataSource: DataSource | null = null;
  private static instance: RoomDao | null = null;

  constructor() {
    super();
    this.initialize();
  }

  // ✅ Singleton pattern สำหรับ RoomDao
  public static getInstance(): RoomDao {
    if (!RoomDao.instance) {
      RoomDao.instance = new RoomDao();
    }
    return RoomDao.instance;
  }

  private async initialize(): Promise<void> {
    try {
      console.log("🔄 Initializing RoomDao...");
      this.dataSource = await connectDatabase();
      console.log("✅ RoomDao initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize RoomDao:", error);
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
        this.dataSource = await connectDatabase();
      } catch (error) {
        throw new Error(`❌ Database connection is not established: ${error}`);
      }
    }
  }

  async countRoom(): Promise<number> {
    await this.checkConnection();
    try {
      const result = await this.dataSource!.query("SELECT COUNT(*) FROM room");
      return Number(result[0].count);
    } catch (error) {
      this.logDbError("countRoom", error);
      throw error;
    }
  }

  async getRoom(page: number, limit: number): Promise<Room[]> {
    await this.checkConnection();
    const offset = (page - 1) * limit;

    try {
      const result = await this.dataSource!.query(
        `SELECT 
        r.room_id,
        r.room_name,
        r.floor,
        r.seat_number,
        r.status,
        r.faculty_id,
        r.building_id,
        COALESCE(f.faculty_name, '') AS faculty_name,
        COALESCE(b.building_name, '') AS building_name
      FROM room r
      LEFT JOIN faculty f ON f.faculty_id = r.faculty_id
      LEFT JOIN building b ON b.building_id = r.building_id
      ORDER BY r.room_id ASC
      LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      return result;
    } catch (error) {
      this.logDbError("getRoom", error);
      throw error;
    }
  }

  // ✅ เพิ่มฟังก์ชันใหม่สำหรับดึงห้องทั้งหมดโดยไม่ใช้ pagination
  async getAllRooms(): Promise<Room[]> {
    await this.checkConnection();
    try {
      const result = await this.dataSource!.query(
        `SELECT 
        r.room_id,
        r.room_name,
        r.floor,
        r.seat_number,
        r.status,
        r.faculty_id,
        r.building_id,
        COALESCE(f.faculty_name, '') AS faculty_name,
        COALESCE(b.building_name, '') AS building_name
      FROM room r
      LEFT JOIN faculty f ON f.faculty_id = r.faculty_id
      LEFT JOIN building b ON b.building_id = r.building_id
      ORDER BY r.room_id ASC`
      );
      return result;
    } catch (error) {
      this.logDbError("getAllRooms", error);
      throw error;
    }
  }

  async getRoomByID(room_id: number): Promise<Room[]> {
    await this.checkConnection();
    try {
      return await this.dataSource!.query(
        "SELECT * FROM room WHERE room_id = $1",
        [room_id]
      );
    } catch (error) {
      this.logDbError("getRoomByID", error);
      throw error;
    }
  }

  async getRoomByName(room_name: string): Promise<Room[]> {
    await this.checkConnection();
    try {
      return await this.dataSource!.query(
        "SELECT * FROM room WHERE room_name = $1",
        [room_name.trim()]
      );
    } catch (error) {
      this.logDbError("getRoomByName", error);
      throw error;
    }
  }

  async searchRoom(params: {
    room_name?: string;
    building_name?: string;
    seat_number?: number;
  }): Promise<Room[]> {
    await this.checkConnection();

    const conditions: string[] = [];
    const values: any[] = [];

    if (params.room_name) {
      conditions.push("r.room_name ILIKE $" + (values.length + 1));
      values.push(`%${params.room_name.trim()}%`);
    }

    if (params.building_name) {
      conditions.push("b.building_name ILIKE $" + (values.length + 1));
      values.push(`%${params.building_name.trim()}%`);
    }

    if (params.seat_number !== undefined) {
      conditions.push("r.seat_number = $" + (values.length + 1));
      values.push(params.seat_number);
    }

    const whereClause =
      conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

    try {
      const result = await this.dataSource!.query(
        `SELECT 
          r.room_id,
          r.room_name,
          r.floor,
          r.seat_number,
          r.status,
          r.faculty_id,
          r.building_id,
          COALESCE(f.faculty_name, '') AS faculty_name,
          COALESCE(b.building_name, '') AS building_name
        FROM room r
        LEFT JOIN faculty f ON f.faculty_id = r.faculty_id
        LEFT JOIN building b ON b.building_id = r.building_id
        ${whereClause}
        ORDER BY r.room_id ASC`,
        values
      );
      return result;
    } catch (error) {
      this.logDbError("searchRoom", error);
      throw error;
    }
  }

  // ✅ เพิ่มฟังก์ชันตรวจสอบห้องซ้ำที่ครอบคลุมมากขึ้น
  async checkRoomExists(
    faculty_id: number,
    building_id: number,
    room_name: string,
    floor: string,
    seat_number: number
  ): Promise<Room[]> {
    await this.checkConnection();
    try {
      // ตรวจสอบทั้ง room_name และ combination ของข้อมูลอื่นๆ
      return await this.dataSource!.query(
        `SELECT * FROM room WHERE 
          (room_name = $1) OR 
          (faculty_id = $2 AND building_id = $3 AND floor = $4 AND seat_number = $5)`,
        [room_name.trim(), faculty_id, building_id, floor.trim(), seat_number]
      );
    } catch (error) {
      this.logDbError("checkRoomExists", error);
      throw error;
    }
  }

  async getRoomIDByFacultyID(faculty_id: number): Promise<Room[]> {
    await this.checkConnection();
    try {
      return await this.dataSource!.query(
        "SELECT room_id FROM room WHERE faculty_id = $1",
        [faculty_id]
      );
    } catch (error) {
      this.logDbError("getRoomIDByFacultyID", error);
      throw error;
    }
  }

  async getRoomIDByBuildingID(building_id: number): Promise<Room[]> {
    await this.checkConnection();
    try {
      return await this.dataSource!.query(
        "SELECT room_id FROM room WHERE building_id = $1",
        [building_id]
      );
    } catch (error) {
      this.logDbError("getRoomIDByBuildingID", error);
      throw error;
    }
  }

  async addRoom(
    faculty_id: number,
    building_id: number,
    room_name: string,
    floor: string,
    seat_number: number,
    status: string
  ): Promise<Room> {
    await this.checkConnection();

    const trimmedName = room_name.trim();
    const trimmedFloor = floor.trim();
    const trimmedStatus = status.trim();
    const allowedStatuses = ["Active", "Inactive"];
    if (!allowedStatuses.includes(trimmedStatus)) {
      throw new Error(`❌ Invalid status value: ${trimmedStatus}`);
    }

    try {
      const result = await this.dataSource!.query(
        `INSERT INTO room (
          faculty_id, building_id, room_name, floor, seat_number, status
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [
          faculty_id,
          building_id,
          trimmedName,
          trimmedFloor,
          seat_number,
          trimmedStatus,
        ]
      );
      return result[0];
    } catch (error) {
      this.logDbError("addRoom", error);
      throw error;
    }
  }

  async updatedRoom(
    room_id: number,
    faculty_id: number,
    building_id: number,
    room_name: string,
    floor: string,
    seat_number: number,
    status: string
  ): Promise<Room | null> {
    await this.checkConnection();
    try {
      const result = await this.dataSource!.query(
        `UPDATE room SET 
          faculty_id = $1,
          building_id = $2,
          room_name = $3,
          floor = $4,
          seat_number = $5,
          status = $6
        WHERE room_id = $7
        RETURNING *`,
        [
          faculty_id,
          building_id,
          room_name.trim(),
          floor.trim(),
          seat_number,
          status.trim(),
          room_id,
        ]
      );
      return result[0] || null;
    } catch (error) {
      this.logDbError("updatedRoom", error);
      throw error;
    }
  }

  async updatedRoomNotRoomName(
    room_id: number,
    faculty_id: number,
    building_id: number,
    floor: string,
    seat_number: number,
    status: string
  ): Promise<void> {
    await this.checkConnection();
    try {
      await this.dataSource!.query(
        `UPDATE room SET 
          faculty_id = $1,
          building_id = $2,
          floor = $3,
          seat_number = $4,
          status = $5
        WHERE room_id = $6`,
        [
          faculty_id,
          building_id,
          floor.trim(),
          seat_number,
          status.trim(),
          room_id,
        ]
      );
    } catch (error) {
      this.logDbError("updatedRoomNotRoomName", error);
      throw error;
    }
  }

  async save(room: Room): Promise<Room> {
    await this.checkConnection();
    try {
      const repo: Repository<Room> = this.dataSource!.getRepository(Room);
      const saved = await repo.save(room);
      return saved;
    } catch (error) {
      this.logDbError("save", error);
      throw error;
    }
  }

  async softDeleteRoom(room_id: number): Promise<Room | null> {
    await this.checkConnection();
    try {
      const result = await this.dataSource!.query(
        `UPDATE room SET status = 'Inactive' WHERE room_id = $1 RETURNING *`,
        [room_id]
      );
      return result[0] || null;
    } catch (error) {
      this.logDbError("softDeleteRoom", error);
      throw error;
    }
  }

  async hardDeleteRoom(room_id: number): Promise<Room | null> {
    await this.checkConnection();
    try {
      const result = await this.dataSource!.query(
        `DELETE FROM room WHERE room_id = $1 RETURNING *`,
        [room_id]
      );
      return result[0] || null;
    } catch (error) {
      this.logDbError("hardDeleteRoom", error);
      throw error;
    }
  }

  async deletedRoomByFacultyID(faculty_id: number): Promise<void> {
    await this.checkConnection();
    try {
      await this.dataSource!.query("DELETE FROM room WHERE faculty_id = $1", [
        faculty_id,
      ]);
    } catch (error) {
      this.logDbError("deletedRoomByFacultyID", error);
      throw error;
    }
  }

  async deletedRoomByBuildingID(building_id: number): Promise<void> {
    await this.checkConnection();
    try {
      await this.dataSource!.query("DELETE FROM room WHERE building_id = $1", [
        building_id,
      ]);
    } catch (error) {
      this.logDbError("deletedRoomByBuildingID", error);
      throw error;
    }
  }

  async hasRelations(room_id: number): Promise<boolean> {
    await this.checkConnection();
    try {
      const result = await this.dataSource!.query(
        "SELECT 1 FROM activity WHERE room_id = $1 LIMIT 1",
        [room_id]
      );
      return result.length > 0;
    } catch (error) {
      this.logDbError("hasRelations", error);
      throw error;
    }
  }

  // ✅ ฟังก์ชันตรวจสอบห้องที่ว่างในช่วงเวลาที่กำหนด
  async getAvailableRooms(
    start_activity_date: string,
    end_activity_date: string,
    exclude_activity_id?: number
  ): Promise<Room[]> {
    await this.checkConnection();
    try {
      let query = `
        SELECT DISTINCT
          r.room_id,
          r.room_name,
          r.floor,
          r.seat_number,
          r.status,
          r.faculty_id,
          r.building_id,
          COALESCE(f.faculty_name, '') AS faculty_name,
          COALESCE(b.building_name, '') AS building_name
        FROM room r
        LEFT JOIN faculty f ON f.faculty_id = r.faculty_id
        LEFT JOIN building b ON b.building_id = r.building_id
        WHERE r.status = 'Active'
        AND r.room_id NOT IN (
          SELECT DISTINCT a.room_id
          FROM activity a
          WHERE a.room_id IS NOT NULL
          AND a.activity_status = 'Public'
          AND (
            (a.start_activity_date <= $1 AND a.end_activity_date >= $1)
            OR (a.start_activity_date <= $2 AND a.end_activity_date >= $2)
            OR (a.start_activity_date >= $1 AND a.end_activity_date <= $2)
          )
      `;

      const params: any[] = [start_activity_date, end_activity_date];

      // ถ้ามี exclude_activity_id ให้ไม่รวมกิจกรรมนั้น (สำหรับการแก้ไข)
      if (exclude_activity_id) {
        query += ` AND a.activity_id != $3`;
        params.push(exclude_activity_id);
      }

      query += `) ORDER BY r.room_name ASC`;

      const result = await this.dataSource!.query(query, params);
      return result;
    } catch (error) {
      this.logDbError("getAvailableRooms", error);
      throw error;
    }
  }

  // ✅ ฟังก์ชันตรวจสอบห้องที่ถูกใช้งานในช่วงเวลาที่กำหนด
  async getRoomConflicts(
    room_id: number,
    start_activity_date: string,
    end_activity_date: string,
    exclude_activity_id?: number
  ): Promise<any[]> {
    await this.checkConnection();
    try {
      let query = `
        SELECT 
          a.activity_id,
          a.activity_name,
          a.start_activity_date,
          a.end_activity_date,
          a.activity_status
        FROM activity a
        WHERE a.room_id = $1
        AND a.activity_status = 'Public'
        AND (
          (a.start_activity_date <= $2 AND a.end_activity_date >= $2)
          OR (a.start_activity_date <= $3 AND a.end_activity_date >= $3)
          OR (a.start_activity_date >= $2 AND a.end_activity_date <= $3)
        )
      `;

      const params: any[] = [room_id, start_activity_date, end_activity_date];

      // ถ้ามี exclude_activity_id ให้ไม่รวมกิจกรรมนั้น
      if (exclude_activity_id) {
        query += ` AND a.activity_id != $4`;
        params.push(exclude_activity_id);
      }

      query += ` ORDER BY a.start_activity_date ASC`;

      const result = await this.dataSource!.query(query, params);
      return result;
    } catch (error) {
      this.logDbError("getRoomConflicts", error);
      throw error;
    }
  }

  // ✅ ฟังก์ชันตรวจสอบห้องที่ว่างทั้งหมด (ไม่จำกัดเวลา)
  async getAllAvailableRooms(): Promise<Room[]> {
    await this.checkConnection();
    try {
      const result = await this.dataSource!.query(`
        SELECT 
          r.room_id,
          r.room_name,
          r.floor,
          r.seat_number,
          r.status,
          r.faculty_id,
          r.building_id,
          COALESCE(f.faculty_name, '') AS faculty_name,
          COALESCE(b.building_name, '') AS building_name
        FROM room r
        LEFT JOIN faculty f ON f.faculty_id = r.faculty_id
        LEFT JOIN building b ON b.building_id = r.building_id
        WHERE r.status = 'Active'
        ORDER BY r.room_name ASC
      `);
      return result;
    } catch (error) {
      this.logDbError("getAllAvailableRooms", error);
      throw error;
    }
  }
}
