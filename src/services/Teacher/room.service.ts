// // src/services/Teacher/room.service.ts

// import redis from "../../config/redis";
// import { RoomDao } from "../../daos/Teacher/room.dao";
// import { Room } from "../../entity/room.entity";
// import { ErrorHandledService } from "../error.handdled.service";

// export class RoomService extends ErrorHandledService {
//   constructor(private readonly roomDao = new RoomDao()) {
//     super();
//   }

//   public async countRoom(): Promise<number> {
//     try {
//       const count = await this.roomDao.countRoom();
//       this.logInfo("📊 Room count fetched", { count });
//       return count;
//     } catch (error) {
//       this.logError("❌ Error in countRoom", error);
//       throw error;
//     }
//   }

//   public async getRoom(): Promise<Room[]> {
//     const cacheKey = "room:all";

//     try {
//       const cached = await redis.get(cacheKey);
//       if (cached) {
//         this.logInfo("📦 Returning cached room data");
//         return JSON.parse(cached);
//       }

//       const data = await this.roomDao.getRoom();
//       await redis.set(cacheKey, JSON.stringify(data), "EX", 60);
//       this.logInfo("📤 Room data retrieved and cached", {
//         count: data.length,
//       });

//       return data;
//     } catch (error) {
//       this.logError("❌ Error in getRoom", error);
//       throw error;
//     }
//   }

//   public async addRoom(
//     faculty_id: number,
//     building_id: number,
//     room_name: string,
//     floor: string,
//     seat_number: number,
//     status: string
//   ): Promise<Room | null> {
//     try {
//       const existing = await this.roomDao.getRoomByName(room_name);
//       if (existing.length > 0) {
//         this.logInfo("🚫 Duplicate room name", { room_name });
//         return null;
//       }

//       const created = await this.roomDao.addRoom(
//         faculty_id,
//         building_id,
//         room_name,
//         floor,
//         seat_number,
//         status
//       );

//       await redis.del("room:all");
//       this.logInfo("🆕 Room created", { room_name, room_id: created.room_id });
//       return created;
//     } catch (error) {
//       this.logError("❌ Error in addRoom", error);
//       throw error;
//     }
//   }

//   public async updatedRoom(
//     room_id: number,
//     faculty_id: number,
//     building_id: number,
//     room_name: string,
//     floor: string,
//     seat_number: number,
//     status: string
//   ): Promise<Room | null> {
//     try {
//       const found = await this.roomDao.getRoomByID(room_id);
//       if (!found.length) return null;

//       const currentName = found[0].room_name;
//       let updated: Room | null = null;

//       if (room_name === currentName) {
//         await this.roomDao.updatedRoomNotRoomName(
//           room_id,
//           faculty_id,
//           building_id,
//           floor,
//           seat_number,
//           status
//         );
//         updated = (await this.roomDao.getRoomByID(room_id))[0];
//       } else {
//         updated = await this.roomDao.updatedRoom(
//           room_id,
//           faculty_id,
//           building_id,
//           room_name,
//           floor,
//           seat_number,
//           status
//         );
//       }

//       await redis.del("room:all");
//       this.logInfo("✏️ Room updated", { room_id });
//       return updated;
//     } catch (error) {
//       this.logError("❌ Error in updatedRoom", error);
//       throw error;
//     }
//   }

//   public async updateRoomFloor(room_id: number, floor: string): Promise<Room> {
//     // ดึงอาร์เรย์มาเก็บใน rooms
//     const rooms = await this.roomDao.getRoomByID(room_id);
//     if (!rooms.length) {
//       throw new Error("Room not found");
//     }

//     // ดึง element แรก
//     const room = rooms[0];
//     room.floor = floor;

//     // เรียก save
//     return this.roomDao.save(room);
//   }

//   public async deleteRoom(room_id: number): Promise<"soft" | "hard" | null> {
//     try {
//       const hasRelation = await this.roomDao.hasRelations(room_id);

//       let deleted: Room | null = null;
//       if (hasRelation) {
//         deleted = await this.roomDao.softDeleteRoom(room_id);
//         this.logInfo("🟡 Soft deleted room", { room_id });
//       } else {
//         deleted = await this.roomDao.hardDeleteRoom(room_id);
//         this.logInfo("🗑️ Hard deleted room", { room_id });
//       }

//       await redis.del("room:all");
//       return deleted ? (hasRelation ? "soft" : "hard") : null;
//     } catch (error) {
//       this.logError("❌ Error in deleteRoom", error);
//       throw error;
//     }
//   }
// }

// src/services/Teacher/room.service.ts

import redis from "../../config/redis";
import { RoomDao } from "../../daos/Teacher/room.dao";
import { Room } from "../../entity/room.entity";
import { ErrorHandledService } from "../error.handdled.service";

export class RoomService extends ErrorHandledService {
  constructor(private readonly roomDao = new RoomDao()) {
    super();
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

  // public async getRoom(): Promise<Room[]> {
  //   const cacheKey = "room:all";

  //   try {
  //     const cached = await redis.get(cacheKey);
  //     if (cached) {
  //       const parsed = JSON.parse(cached);
  //       if (Array.isArray(parsed)) return parsed;
  //       if (Array.isArray(parsed.roomData)) return parsed.roomData; // รองรับ cache เก่า
  //       return [];
  //     }

  //     const data = await this.roomDao.getRoom();
  //     await redis.set(cacheKey, JSON.stringify(data), "EX", 60);
  //     this.logInfo("📤 Room data retrieved and cached", {
  //       count: data.length,
  //     });

  //     return data;
  //   } catch (error) {
  //     this.logError("❌ Error in getRoom", error);
  //     throw error;
  //   }
  // }

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

  // public async deletedRoom(room_id: number): Promise<Room | null> {
  //   const cacheKey = "room:all";

  //   try {
  //     const hasRelation = await this.roomDao.hasRelations(room_id);
  //     let deleted: Room | null = null;

  //     if (hasRelation) {
  //       deleted = await this.roomDao.softDeleteRoom(room_id);
  //       this.logInfo("🟡 Soft deleted room", { room_id });
  //     } else {
  //       deleted = await this.roomDao.hardDeleteRoom(room_id);
  //       this.logInfo("🗑️ Hard deleted room", { room_id });
  //     }

  //     await redis.del(cacheKey);

  //     if (!deleted) {
  //       this.logInfo("❌ No room deleted", { room_id });
  //       return null;
  //     }

  //     return deleted;
  //   } catch (error) {
  //     this.logError("❌ Error in deletedRoom", error);
  //     throw error;
  //   }
  // }

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
}
