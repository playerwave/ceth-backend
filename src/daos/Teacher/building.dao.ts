// import { DataSource } from "typeorm";
// import { Building } from "../../entity/building.entity";
// import { connectDatabase } from "../../db/database";
// import { ErrorHandledDao } from "../error.handled.dao";

// export class BuildingDao extends ErrorHandledDao {
//   private dataSource: DataSource | null = null;

//   constructor() {
//     super();
//     this.initialize(); // ❗เรียก async โดยไม่ await → เหมือน RoomDao
//   }

//   private async initialize(): Promise<void> {
//     try {
//       this.dataSource = await connectDatabase();
//       console.log("✅ BuildingDao initialized");
//     } catch (error) {
//       this.logDbError("initialize", error);
//     }
//   }

//   private checkConnection(): void {
//     if (!this.dataSource) {
//       throw new Error("❌ Database connection is not established");
//     }
//   }

//   public async countBuilding(): Promise<number> {
//     this.checkConnection();
//     try {
//       const result = await this.dataSource!.query(
//         `SELECT COUNT(*) FROM building`
//       );
//       return parseInt(result[0].count);
//     } catch (error) {
//       this.logDbError("countBuilding", error);
//       throw error;
//     }
//   }

//   public async getBuilding(page: number, limit: number): Promise<Building[]> {
//     this.checkConnection();
//     try {
//       const offset = (page - 1) * limit;
//       return await this.dataSource!.query(
//         `SELECT * FROM building ORDER BY building_id ASC LIMIT $1 OFFSET $2`,
//         [limit, offset]
//       );
//     } catch (error) {
//       this.logDbError("getBuilding", error);
//       throw error;
//     }
//   }

//   public async getBuildingByName(building_name: string): Promise<Building[]> {
//     this.checkConnection();
//     try {
//       const name = building_name.trim();
//       return await this.dataSource!.query(
//         `SELECT * FROM building WHERE building_name ILIKE $1`,
//         [`%${name}%`]
//       );
//     } catch (error) {
//       this.logDbError("getBuildingByName", error);
//       throw error;
//     }
//   }

//   public async getBuildingByID(building_id: number): Promise<Building[]> {
//     this.checkConnection();
//     try {
//       return await this.dataSource!.query(
//         `SELECT * FROM building WHERE building_id = $1`,
//         [building_id]
//       );
//     } catch (error) {
//       this.logDbError("getBuildingByID", error);
//       throw error;
//     }
//   }

//   public async addBuilding(
//     faculty_id: number,
//     building_name: string
//   ): Promise<Building> {
//     this.checkConnection();
//     try {
//       const name = building_name.trim();
//       const result = await this.dataSource!.query(
//         `INSERT INTO building (faculty_id, building_name) VALUES ($1, $2) RETURNING *`,
//         [faculty_id, name]
//       );
//       return result[0]; // ✅ return object ที่ถูก insert
//     } catch (error) {
//       this.logDbError("addBuilding", error);
//       throw error;
//     }
//   }

//   public async updatedBuildingByName(
//     building_id: number,
//     faculty_id: number,
//     building_name: string
//   ): Promise<Building | null> {
//     this.checkConnection();
//     try {
//       const name = building_name.trim();
//       const result = await this.dataSource!.query(
//         `UPDATE building SET faculty_id = $1, building_name = $2 WHERE building_id = $3 RETURNING *`,
//         [faculty_id, name, building_id]
//       );
//       return result[0] || null;
//     } catch (error) {
//       this.logDbError("updatedBuildingByName", error);
//       throw error;
//     }
//   }

//   public async deletedBuilding(building_id: number): Promise<Building | null> {
//     this.checkConnection();

//     try {
//       // ตรวจสอบว่าตึกมีอยู่หรือไม่
//       const existing = await this.dataSource!.query(
//         `SELECT * FROM building WHERE building_id = $1`,
//         [building_id]
//       );

//       if (existing.length === 0) {
//         return null; // ❗️ไม่พบตึก
//       }

//       // ตรวจสอบว่ามี room ผูกอยู่หรือไม่
//       const rooms = await this.dataSource!.query(
//         `SELECT 1 FROM room WHERE building_id = $1 LIMIT 1`,
//         [building_id]
//       );

//       if (rooms.length > 0) {
//         throw new Error("ไม่สามารถลบตึกได้ เนื่องจากมีห้องที่ผูกอยู่");
//       }

//       // ลบได้
//       const result = await this.dataSource!.query(
//         `DELETE FROM building WHERE building_id = $1 RETURNING *`,
//         [building_id]
//       );

//       return result.length > 0 ? result[0] : null;
//     } catch (error) {
//       this.logDbError("deletedBuilding", error);
//       throw error;
//     }
//   }
// }

import { DataSource, Repository } from "typeorm";
import { Building } from "../../entity/building.entity";
import { connectDatabase } from "../../db/database";
import { ErrorHandledDao } from "../error.handled.dao";

export class BuildingDao extends ErrorHandledDao {
  private dataSource: DataSource | null = null;

  constructor() {
    super();
    this.initialize(); // ❗ async init เหมือน RoomDao
  }

  private async initialize(): Promise<void> {
    try {
      this.dataSource = await connectDatabase();
      console.log("✅ BuildingDao initialized");
    } catch (error) {
      this.logDbError("initialize", error);
    }
  }

  private checkConnection(): void {
    if (!this.dataSource?.isInitialized) {
      throw new Error("❌ Database connection is not established");
    }
  }

  public async countBuilding(): Promise<number> {
    this.checkConnection();
    try {
      const result = await this.dataSource!.query(
        `SELECT COUNT(*) FROM building`
      );
      return parseInt(result[0].count);
    } catch (error) {
      this.logDbError("countBuilding", error);
      throw error;
    }
  }

  public async getBuilding(page: number, limit: number): Promise<Building[]> {
    this.checkConnection();
    const offset = (page - 1) * limit;
    try {
      return await this.dataSource!.query(
        `SELECT * FROM building ORDER BY building_id ASC LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
    } catch (error) {
      this.logDbError("getBuilding", error);
      throw error;
    }
  }

  public async getBuildingByID(building_id: number): Promise<Building[]> {
    this.checkConnection();
    try {
      return await this.dataSource!.query(
        `SELECT * FROM building WHERE building_id = $1`,
        [building_id]
      );
    } catch (error) {
      this.logDbError("getBuildingByID", error);
      throw error;
    }
  }

  public async getBuildingByName(building_name: string): Promise<Building[]> {
    this.checkConnection();
    try {
      const name = building_name.trim();
      return await this.dataSource!.query(
        `SELECT * FROM building WHERE building_name ILIKE $1`,
        [`%${name}%`]
      );
    } catch (error) {
      this.logDbError("getBuildingByName", error);
      throw error;
    }
  }

  public async getBuildingsByFaculty(faculty_id: number): Promise<Building[]> {
    this.checkConnection();
    try {
      return await this.dataSource!.query(
        `SELECT * FROM building WHERE faculty_id = $1 ORDER BY building_id ASC`,
        [faculty_id]
      );
    } catch (error) {
      this.logDbError("getBuildingsByFaculty", error);
      throw error;
    }
  }

  public async addBuilding(
    faculty_id: number,
    building_name: string
  ): Promise<Building> {
    this.checkConnection();
    try {
      const name = building_name.trim();
      const result = await this.dataSource!.query(
        `INSERT INTO building (faculty_id, building_name) VALUES ($1, $2) RETURNING *`,
        [faculty_id, name]
      );
      return result[0];
    } catch (error) {
      this.logDbError("addBuilding", error);
      throw error;
    }
  }

  public async updatedBuildingByName(
    building_id: number,
    faculty_id: number,
    building_name: string
  ): Promise<Building | null> {
    this.checkConnection();
    try {
      const name = building_name.trim();
      const result = await this.dataSource!.query(
        `UPDATE building SET faculty_id = $1, building_name = $2 WHERE building_id = $3 RETURNING *`,
        [faculty_id, name, building_id]
      );
      return result[0] || null;
    } catch (error) {
      this.logDbError("updatedBuildingByName", error);
      throw error;
    }
  }

  public async save(building: Building): Promise<Building> {
    this.checkConnection();
    try {
      const repo: Repository<Building> =
        this.dataSource!.getRepository(Building);
      return await repo.save(building);
    } catch (error) {
      this.logDbError("save", error);
      throw error;
    }
  }

  public async deletedBuilding(building_id: number): Promise<Building | null> {
    this.checkConnection();
    try {
      const existing = await this.getBuildingByID(building_id);
      if (existing.length === 0) return null;

      const hasRooms = await this.dataSource!.query(
        `SELECT 1 FROM room WHERE building_id = $1 LIMIT 1`,
        [building_id]
      );

      if (hasRooms.length > 0) {
        throw new Error("ไม่สามารถลบตึกได้ เนื่องจากมีห้องที่ผูกอยู่");
      }

      const result = await this.dataSource!.query(
        `DELETE FROM building WHERE building_id = $1 RETURNING *`,
        [building_id]
      );
      return result[0] || null;
    } catch (error) {
      this.logDbError("deletedBuilding", error);
      throw error;
    }
  }

  public async hasRelations(building_id: number): Promise<boolean> {
    this.checkConnection();
    try {
      const result = await this.dataSource!.query(
        `SELECT 1 FROM room WHERE building_id = $1 LIMIT 1`,
        [building_id]
      );
      return result.length > 0;
    } catch (error) {
      this.logDbError("hasRelations", error);
      throw error;
    }
  }
}
