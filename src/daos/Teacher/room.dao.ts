// import { DataSource, Repository } from "typeorm";
// import { Room } from "../../entity/room.entity";
// import { connectDatabase } from "../../db/database";
// import { ErrorHandledDao } from "../error.handled.dao";

// export class RoomDao extends ErrorHandledDao {
//   private dataSource: DataSource | null = null;

//   constructor() {
//     super();
//     this.initialize();
//   }

//   private async initialize(): Promise<void> {
//     try {
//       this.dataSource = await connectDatabase();
//       console.log("✅ RoomDao initialized");
//     } catch (error) {
//       this.logDbError("initialize", error);
//     }
//   }

//   private checkConnection(): void {
//     if (!this.dataSource) {
//       throw new Error("❌ Database connection is not established");
//     }
//   }

//   public async countRoom(): Promise<number> {
//     this.checkConnection();
//     try {
//       const result = await this.dataSource!.query("SELECT COUNT(*) FROM room");
//       return Number(result[0].count);
//     } catch (error) {
//       this.logDbError("countRoom", error);
//       throw error;
//     }
//   }

//   public async getRoom(): Promise<Room[]> {
//     this.checkConnection();
//     try {
//       const result = await this.dataSource!.query(
//         "SELECT * FROM room ORDER BY room_id ASC"
//       );
//       return result;
//     } catch (error) {
//       this.logDbError("getRoom", error);
//       throw error;
//     }
//   }

//   public async getRoomByName(room_name: string): Promise<Room[]> {
//     this.checkConnection();
//     try {
//       const name = room_name.trim();
//       const result = await this.dataSource!.query(
//         "SELECT room_name FROM room WHERE room_name LIKE $1",
//         [`%${name}%`]
//       );
//       return result;
//     } catch (error) {
//       this.logDbError("getRoomByName", error);
//       throw error;
//     }
//   }

//   public async getRoomByID(room_id: number): Promise<Room[]> {
//     this.checkConnection();
//     try {
//       return await this.dataSource!.query(
//         "SELECT * FROM room WHERE room_id = $1",
//         [room_id]
//       );
//     } catch (error) {
//       this.logDbError("getRoomByID", error);
//       throw error;
//     }
//   }

//   public async getRoomIDByBuildingID(building_id: number): Promise<Room[]> {
//     this.checkConnection();
//     try {
//       return await this.dataSource!.query(
//         "SELECT room_id FROM room WHERE building_id = $1",
//         [building_id]
//       );
//     } catch (error) {
//       this.logDbError("getRoomIDByBuildingID", error);
//       throw error;
//     }
//   }

//   public async getRoomIDByFacultyID(faculty_id: number): Promise<Room[]> {
//     this.checkConnection();
//     try {
//       return await this.dataSource!.query(
//         "SELECT room_id FROM room WHERE faculty_id = $1",
//         [faculty_id]
//       );
//     } catch (error) {
//       this.logDbError("getRoomIDByFacultyID", error);
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
//   ): Promise<Room> {
//     this.checkConnection();

//     const trimmedRoomName = room_name?.trim();
//     const trimmedFloor = floor?.trim();
//     const trimmedStatus = status?.trim();

//     const allowedStatuses = ["Active", "Inactive"];
//     if (!allowedStatuses.includes(trimmedStatus)) {
//       throw new Error(`❌ Invalid status value: ${trimmedStatus}`);
//     }

//     try {
//       const result = await this.dataSource!.query(
//         `
//         INSERT INTO room (
//           faculty_id, building_id, room_name, floor, seat_number, status
//         ) VALUES ($1, $2, $3, $4, $5, $6)
//         RETURNING *
//       `,
//         [
//           faculty_id,
//           building_id,
//           trimmedRoomName,
//           trimmedFloor,
//           seat_number,
//           trimmedStatus,
//         ]
//       );
//       return result[0]; // ✅ คืนข้อมูลห้องที่สร้าง
//     } catch (error) {
//       this.logDbError("addRoom", error);
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
//   ): Promise<any | null> {
//     this.checkConnection();
//     try {
//       const result = await this.dataSource!.query(
//         `UPDATE room SET faculty_id = $1, building_id = $2, room_name = $3, floor = $4, seat_number = $5, status = $6 WHERE room_id = $7 RETURNING *`,
//         [
//           faculty_id,
//           building_id,
//           room_name.trim(),
//           floor.trim(),
//           seat_number,
//           status.trim(),
//           room_id,
//         ]
//       );
//       return result[0] || null;
//     } catch (error) {
//       this.logDbError("updatedRoom", error);
//       throw error;
//     }
//   }

//   public async updatedRoomNotRoomName(
//     room_id: number,
//     faculty_id: number,
//     building_id: number,
//     floor: string,
//     seat_number: number,
//     status: string
//   ): Promise<void> {
//     this.checkConnection();
//     try {
//       await this.dataSource!.query(
//         `UPDATE room SET faculty_id = $1, building_id = $2, floor = $3, seat_number = $4, status = $5 WHERE room_id = $6`,
//         [
//           faculty_id,
//           building_id,
//           floor.trim(),
//           seat_number,
//           status.trim(),
//           room_id,
//         ]
//       );
//     } catch (error) {
//       this.logDbError("updatedRoomNotRoomName", error);
//       throw error;
//     }
//   }

//   // room.dao.ts
//   public async softDeleteRoom(room_id: number): Promise<Room | null> {
//     this.checkConnection();
//     try {
//       const result = await this.dataSource!.query(
//         `UPDATE room SET status = 'InActive' WHERE room_id = $1 RETURNING *`,
//         [room_id]
//       );
//       return result.length > 0 ? result[0] : null;
//     } catch (error) {
//       this.logDbError("softDeleteRoom", error);
//       throw error;
//     }
//   }

//   public async hardDeleteRoom(room_id: number): Promise<Room | null> {
//     this.checkConnection();
//     try {
//       const result = await this.dataSource!.query(
//         `DELETE FROM room WHERE room_id = $1 RETURNING *`,
//         [room_id]
//       );
//       return result.length > 0 ? result[0] : null;
//     } catch (error) {
//       this.logDbError("hardDeleteRoom", error);
//       throw error;
//     }
//   }

//   public async save(room: Room): Promise<Room> {
//     this.checkConnection();
//     const repo: Repository<Room> = this.dataSource!.getRepository(Room);
//     try {
//       return await repo.save(room);
//     } catch (error) {
//       this.logDbError("save", error);
//       throw error;
//     }
//   }

//   // ตรวจสอบว่ามี relation กับ activity หรือไม่
//   public async hasRelations(room_id: number): Promise<boolean> {
//     this.checkConnection();
//     const result = await this.dataSource!.query(
//       `SELECT 1 FROM activity WHERE room_id = $1 LIMIT 1`,
//       [room_id]
//     );
//     return result.length > 0;
//   }

//   public async deletedRoomByBuildingID(building_id: number): Promise<void> {
//     this.checkConnection();
//     try {
//       await this.dataSource!.query("DELETE FROM room WHERE building_id = $1", [
//         building_id,
//       ]);
//     } catch (error) {
//       this.logDbError("deletedRoomByBuildingID", error);
//       throw error;
//     }
//   }

//   public async deletedRoomByFacultyID(faculty_id: number): Promise<void> {
//     this.checkConnection();
//     try {
//       await this.dataSource!.query("DELETE FROM room WHERE faculty_id = $1", [
//         faculty_id,
//       ]);
//     } catch (error) {
//       this.logDbError("deletedRoomByFacultyID", error);
//       throw error;
//     }
//   }
// }

// src/daos/Teacher/room.dao.ts
import { DataSource, Repository } from "typeorm";
import { Room } from "../../entity/room.entity";
import { connectDatabase } from "../../db/database";
import { ErrorHandledDao } from "../error.handled.dao";

export class RoomDao extends ErrorHandledDao {
  private dataSource: DataSource | null = null;

  constructor() {
    super();
    this.initialize();
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
        await this.initialize();
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

  // async getRoom(): Promise<Room[]> {
  //   this.checkConnection();
  //   try {
  //     const result = await this.dataSource!.query(
  //       `SELECT
  //         r.room_id,
  //         r.room_name,
  //         r.floor,
  //         r.seat_number,
  //         r.status,
  //         r.faculty_id,
  //         r.building_id,
  //         COALESCE(f.faculty_name, '') AS faculty_name,
  //         COALESCE(b.building_name, '') AS building_name
  //       FROM room r
  //       LEFT JOIN faculty f ON f.faculty_id = r.faculty_id
  //       LEFT JOIN building b ON b.building_id = r.building_id
  //       ORDER BY r.room_id ASC`
  //     );
  //     return result;
  //   } catch (error) {
  //     this.logDbError("getRoom", error);
  //     throw error;
  //   }
  // }

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
}
