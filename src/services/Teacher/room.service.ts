// src/services/Teacher/room.service.ts

import redis from "../../config/redis";
import { RoomDao } from "../../daos/Teacher/room.dao";
import { Room } from "../../entity/room.entity";
import { ErrorHandledService } from "../error.handdled.service";

export class RoomService extends ErrorHandledService {
  private readonly roomDao: RoomDao;

  constructor() {
    super();
    // ✅ ใช้ Singleton DAO
    this.roomDao = RoomDao.getInstance();
  }

  public async countRoom(): Promise<number> {
    try {
      const count = await this.roomDao.countRoom();
      this.logInfo("📊 Room count fetched", { count });
      return count;
    } catch (error) {
      this.logError("❌ Error in countRoom", error);
      throw error;
    }
  }

  public async getRoom(page: number, limit: number): Promise<Room[]> {
    const cacheKey = `room:all:${page}:${limit}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);

        // ✅ ใช้เฉพาะ array ไม่ดึง roomData object
        if (Array.isArray(parsed)) return parsed;
        if (Array.isArray(parsed.roomData)) return parsed.roomData; // รองรับ cache เก่า
        return []; // fallback
      }

      const data = await this.roomDao.getRoom(page, limit); // ✅ DAO return เป็น Room[]
      await redis.set(cacheKey, JSON.stringify(data), "EX", 60); // cache array ล้วน
      return data;
    } catch (error) {
      this.logError("❌ Error in getRoom", error);
      throw error;
    }
  }

  public async getRoomById(room_id: number): Promise<Room | null> {
    try {
      const found = await this.roomDao.getRoomByID(room_id);
      if (!found.length) {
        this.logInfo("❌ room not found", { room_id });
        return null;
      }

      const room = found[0];
      this.logInfo("🍽️ Room retrieved", { room_id });
      return room;
    } catch (error) {
      this.logError("❌ Error in getRoomById", error);
      throw error;
    }
  }

  public async addRoom(
    faculty_id: number,
    building_id: number,
    room_name: string,
    floor: string,
    seat_number: number,
    status: string
  ): Promise<Room | null> {
    const cacheKey = "room:all";

    try {
      const exists = await this.roomDao.getRoomByName(room_name);
      if (exists.length > 0) {
        this.logInfo("🚫 Duplicate room name", { room_name });
        return null;
      }

      const created = await this.roomDao.addRoom(
        faculty_id,
        building_id,
        room_name,
        floor,
        seat_number,
        status
      );

      await redis.del(cacheKey);
      this.logInfo("🆕 Room created", { room_id: created.room_id });
      return created;
    } catch (error) {
      this.logError("❌ Error in addRoom", error);
      throw error;
    }
  }

  public async updatedRoom(
    room_id: number,
    faculty_id: number,
    building_id: number,
    room_name: string,
    floor: string,
    seat_number: number,
    status: string
  ): Promise<Room | null> {
    const cacheKey = "room:all";

    try {
      const found = await this.roomDao.getRoomByID(room_id);
      if (!found.length) {
        this.logInfo("❌ Room not found", { room_id });
        return null;
      }

      const currentName = found[0].room_name;
      let updated: Room | null = null;

      if (room_name === currentName) {
        await this.roomDao.updatedRoomNotRoomName(
          room_id,
          faculty_id,
          building_id,
          floor,
          seat_number,
          status
        );
      } else {
        const dup = await this.roomDao.getRoomByName(room_name);
        if (dup.length > 0) {
          this.logInfo("🚫 Duplicate new room name", { room_name });
          return null;
        }

        await this.roomDao.updatedRoom(
          room_id,
          faculty_id,
          building_id,
          room_name,
          floor,
          seat_number,
          status
        );
      }

      await redis.del(cacheKey);
      const [result] = await this.roomDao.getRoomByID(room_id);
      this.logInfo("✏️ Room updated", { room_id });
      return result || null;
    } catch (error) {
      this.logError("❌ Error in updatedRoom", error);
      throw error;
    }
  }

  public async updateRoomFloor(
    room_id: number,
    floor: string
  ): Promise<Room | null> {
    const cacheKey = "room:all";

    try {
      const rooms = await this.roomDao.getRoomByID(room_id);
      if (!rooms.length) {
        this.logInfo("❌ Room not found for floor update", { room_id });
        return null;
      }

      const room = rooms[0];
      room.floor = floor;

      const updated = await this.roomDao.save(room);
      await redis.del(cacheKey);

      this.logInfo("🏢 Room floor updated", { room_id, new_floor: floor });
      return updated;
    } catch (error) {
      this.logError("❌ Error in updateRoomFloor", error);
      throw error;
    }
  }

  public async deletedRoom(room_id: number): Promise<"soft" | "hard" | null> {
    const cacheKey = "room:all";

    try {
      const hasRelation = await this.roomDao.hasRelations(room_id);
      let deleted: Room | null = null;

      if (hasRelation) {
        deleted = await this.roomDao.softDeleteRoom(room_id);
        this.logInfo("🟡 Soft deleted room", { room_id });
      } else {
        deleted = await this.roomDao.hardDeleteRoom(room_id);
        this.logInfo("🗑️ Hard deleted room", { room_id });
      }

      await redis.del(cacheKey);

      if (!deleted) {
        this.logInfo("❌ No room deleted", { room_id });
        return null;
      }

      return hasRelation ? "soft" : "hard";
    } catch (error) {
      this.logError("❌ Error in deletedRoom", error);
      throw error;
    }
  }

  // ✅ ฟังก์ชันตรวจสอบห้องที่ว่างในช่วงเวลาที่กำหนด
  public async getAvailableRooms(
    start_activity_date: string,
    end_activity_date: string,
    exclude_activity_id?: number
  ): Promise<Room[]> {
    try {
      const rooms = await this.roomDao.getAvailableRooms(
        start_activity_date,
        end_activity_date,
        exclude_activity_id
      );
      this.logInfo("🔍 Available rooms found", {
        count: rooms.length,
        start_date: start_activity_date,
        end_date: end_activity_date,
        exclude_id: exclude_activity_id,
      });
      return rooms;
    } catch (error) {
      this.logError("❌ Error in getAvailableRooms", error);
      throw error;
    }
  }

  // ✅ ฟังก์ชันตรวจสอบห้องที่ถูกใช้งานในช่วงเวลาที่กำหนด
  public async getRoomConflicts(
    room_id: number,
    start_activity_date: string,
    end_activity_date: string,
    exclude_activity_id?: number
  ): Promise<any[]> {
    try {
      const conflicts = await this.roomDao.getRoomConflicts(
        room_id,
        start_activity_date,
        end_activity_date,
        exclude_activity_id
      );
      this.logInfo("⚠️ Room conflicts found", {
        room_id,
        conflicts_count: conflicts.length,
        start_date: start_activity_date,
        end_date: end_activity_date,
      });
      return conflicts;
    } catch (error) {
      this.logError("❌ Error in getRoomConflicts", error);
      throw error;
    }
  }

  // ✅ ฟังก์ชันตรวจสอบห้องที่ว่างทั้งหมด
  public async getAllAvailableRooms(): Promise<Room[]> {
    try {
      const rooms = await this.roomDao.getAllAvailableRooms();
      this.logInfo("📋 All available rooms fetched", { count: rooms.length });
      return rooms;
    } catch (error) {
      this.logError("❌ Error in getAllAvailableRooms", error);
      throw error;
    }
  }
}
