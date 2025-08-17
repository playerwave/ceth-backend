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

  // ✅ เพิ่มฟังก์ชันลบ cache ทั้งหมด
  private async invalidateAllRoomCache(): Promise<void> {
    try {
      this.logInfo("🔄 Starting cache invalidation...");

      // ✅ ตรวจสอบ Redis connection
      try {
        await redis.ping();
      } catch (error) {
        this.logInfo("⚠️ Redis not connected, skipping cache invalidation");
        return;
      }

      // ลบ cache ทั้งหมดที่เกี่ยวข้องกับ room
      const keys = await redis.keys("room:*");
      if (keys.length > 0) {
        await redis.del(...keys);
        this.logInfo("🗑️ All room cache invalidated", { count: keys.length });
      } else {
        this.logInfo("ℹ️ No room cache found to invalidate");
      }

      // ลบ cache ของ buildings และ faculties ด้วย
      const buildingKeys = await redis.keys("building:*");
      const facultyKeys = await redis.keys("faculty:*");

      if (buildingKeys.length > 0) {
        await redis.del(...buildingKeys);
        this.logInfo("🗑️ Building cache invalidated", {
          count: buildingKeys.length,
        });
      } else {
        this.logInfo("ℹ️ No building cache found to invalidate");
      }

      if (facultyKeys.length > 0) {
        await redis.del(...facultyKeys);
        this.logInfo("🗑️ Faculty cache invalidated", {
          count: facultyKeys.length,
        });
      } else {
        this.logInfo("ℹ️ No faculty cache found to invalidate");
      }

      this.logInfo("✅ Cache invalidation completed");
    } catch (error) {
      this.logError("❌ Failed to invalidate cache", error);
    }
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
    try {
      // ✅ เปิด cache ใหม่เพื่อความเร็ว
      const cacheKey = `room:all:${page}:${limit}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          this.logInfo("📦 Returning cached room data", {
            page,
            limit,
            count: parsed.length,
          });
          return parsed;
        }
        if (Array.isArray(parsed.roomData)) {
          this.logInfo("📦 Returning cached room data", {
            page,
            limit,
            count: parsed.roomData.length,
          });
          return parsed.roomData;
        }
        return [];
      }

      const data = await this.roomDao.getRoom(page, limit);

      // ✅ เก็บ cache ใหม่
      await redis.set(cacheKey, JSON.stringify(data), "EX", 60);
      this.logInfo("💾 Cached room data", { page, limit, count: data.length });

      return data;
    } catch (error) {
      this.logError("❌ Error in getRoom", error);
      throw error;
    }
  }

  // ✅ เพิ่มฟังก์ชันใหม่สำหรับดึงห้องทั้งหมด
  public async getAllRooms(): Promise<Room[]> {
    try {
      // ✅ ใช้ cache key แยกต่างหาก
      const cacheKey = "room:all:no-pagination";
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          this.logInfo("📦 Returning cached all rooms data", {
            count: parsed.length,
          });
          return parsed;
        }
        return [];
      }

      // ✅ เรียก DAO โดยตรงเพื่อดึงห้องทั้งหมด
      const data = await this.roomDao.getAllRooms();

      // ✅ เก็บ cache ใหม่
      await redis.set(cacheKey, JSON.stringify(data), "EX", 60);
      this.logInfo("💾 Cached all rooms data", { count: data.length });

      return data;
    } catch (error) {
      this.logError("❌ Error in getAllRooms", error);
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

  public async searchRoom(params: {
    room_name?: string;
    building_name?: string;
    seat_number?: number;
  }): Promise<Room[]> {
    try {
      const results = await this.roomDao.searchRoom(params);
      this.logInfo("🔍 Room search completed", { filters: params, count: results.length });
      return results;
    } catch (error) {
      this.logError("❌ Error in searchRoom", error);
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
  ): Promise<{ room: Room | null; duplicateType: string | null }> {
    try {
      // ✅ ใช้ฟังก์ชันตรวจสอบใหม่ที่ครอบคลุมมากขึ้น
      const exists = await this.roomDao.checkRoomExists(
        faculty_id,
        building_id,
        room_name,
        floor,
        seat_number
      );

      if (exists.length > 0) {
        // ✅ ตรวจสอบว่าเป็น room_name ซ้ำหรือ combination ซ้ำ
        const duplicateName = exists.find(
          (room) => room.room_name === room_name
        );
        const duplicateLocation = exists.find(
          (room) =>
            room.faculty_id === faculty_id &&
            room.building_id === building_id &&
            room.floor === floor &&
            room.seat_number === seat_number
        );

        if (duplicateName) {
          this.logInfo("🚫 Duplicate room name", { room_name });
          return { room: null, duplicateType: "name" };
        }

        if (duplicateLocation) {
          this.logInfo("🚫 Duplicate room location", {
            faculty_id,
            building_id,
            floor,
            seat_number,
          });
          return { room: null, duplicateType: "location" };
        }
      }

      const created = await this.roomDao.addRoom(
        faculty_id,
        building_id,
        room_name,
        floor,
        seat_number,
        status
      );

      // ✅ ลบ cache ทั้งหมดหลังสร้างห้อง
      this.logInfo("🔄 Invalidating cache after room creation...");
      await this.invalidateAllRoomCache();
      this.logInfo("✅ Cache invalidation completed after room creation");

      this.logInfo("🆕 Room created", { room_id: created.room_id });
      return { room: created, duplicateType: null };
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

      // ✅ ลบ cache ทั้งหมดหลังอัพเดทห้อง
      await this.invalidateAllRoomCache();

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
    try {
      const rooms = await this.roomDao.getRoomByID(room_id);
      if (!rooms.length) {
        this.logInfo("❌ Room not found for floor update", { room_id });
        return null;
      }

      const room = rooms[0];
      room.floor = floor;

      const updated = await this.roomDao.save(room);

      // ✅ ลบ cache ทั้งหมดหลังอัพเดท
      await this.invalidateAllRoomCache();

      this.logInfo("🏢 Room floor updated", { room_id, new_floor: floor });
      return updated;
    } catch (error) {
      this.logError("❌ Error in updateRoomFloor", error);
      throw error;
    }
  }

  public async deletedRoom(room_id: number): Promise<"soft" | "hard" | null> {
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

      // ✅ ลบ cache ทั้งหมดหลังลบห้อง
      await this.invalidateAllRoomCache();

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
