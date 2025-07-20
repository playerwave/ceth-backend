// // src/services/Teacher/building.service.ts

// import redis from "../../config/redis";
// import { BuildingDao } from "../../daos/Teacher/building.dao";
// import { Building } from "../../entity/building.entity";
// import { ErrorHandledService } from "../error.handdled.service";

// export class BuildingService extends ErrorHandledService {
//   constructor(private readonly buildingDao = new BuildingDao()) {
//     super();
//   }

//   public async countBuilding(): Promise<number> {
//     try {
//       const count = await this.buildingDao.countBuilding();
//       this.logInfo("📊 Building count fetched", { count });
//       return count;
//     } catch (error) {
//       this.logError("❌ Error in countBuilding", error);
//       throw error;
//     }
//   }

//   public async getBuilding(page: number, limit: number): Promise<Building[]> {
//     const cacheKey = `building:all:${page}:${limit}`;

//     try {
//       const cached = await redis.get(cacheKey);
//       if (cached) {
//         this.logInfo("📦 Returning cached building data");
//         return JSON.parse(cached);
//       }

//       const data = await this.buildingDao.getBuilding(page, limit);
//       await redis.set(cacheKey, JSON.stringify(data), "EX", 60);
//       this.logInfo("📤 Building data retrieved and cached", {
//         count: data.length,
//         page,
//         limit,
//       });

//       return data;
//     } catch (error) {
//       this.logError("❌ Error in getBuilding", error);
//       throw error;
//     }
//   }

//   public async addBuilding(
//     faculty_id: number,
//     building_name: string
//   ): Promise<Building | null> {
//     try {
//       const existing = await this.buildingDao.getBuildingByName(building_name);
//       if (existing.length > 0) {
//         this.logInfo("🚫 Duplicate building name", { building_name });
//         return null;
//       }

//       const created = await this.buildingDao.addBuilding(
//         faculty_id,
//         building_name
//       );
//       await redis.del("building:all");
//       this.logInfo("🆕 Building created", { building_id: created.building_id });

//       return created;
//     } catch (error) {
//       this.logError("❌ Error in addBuilding", error);
//       throw error;
//     }
//   }

//   public async updatedBuildingByName(
//     building_id: number,
//     faculty_id: number,
//     building_name: string
//   ): Promise<Building | null> {
//     try {
//       const existing = await this.buildingDao.getBuildingByName(building_name);
//       const isDuplicate = existing.some(
//         (b) =>
//           b.building_id !== building_id && b.building_name === building_name
//       );

//       if (isDuplicate) {
//         this.logInfo("🚫 Building name already used by another ID", {
//           building_name,
//           building_id,
//         });
//         return null;
//       }

//       const updated = await this.buildingDao.updatedBuildingByName(
//         building_id,
//         faculty_id,
//         building_name
//       );

//       await redis.del("building:all");
//       this.logInfo("✏️ Building updated", { building_id });

//       return updated;
//     } catch (error) {
//       this.logError("❌ Error in updatedBuildingByName", error);
//       throw error;
//     }
//   }

//   public async deletedBuilding(building_id: number): Promise<boolean> {
//     try {
//       const deleted = await this.buildingDao.deletedBuilding(building_id);
//       await redis.del("building:all");

//       if (deleted) {
//         this.logInfo("🗑️ Building deleted", { building_id });
//       }

//       return !!deleted;
//     } catch (error) {
//       this.logError("❌ Error in deletedBuilding", error);
//       throw error;
//     }
//   }
// }

import redis from "../../config/redis";
import { BuildingDao } from "../../daos/Teacher/building.dao";
import { Building } from "../../entity/building.entity";
import { ErrorHandledService } from "../error.handdled.service";

export class BuildingService extends ErrorHandledService {
  constructor(private readonly buildingDao = new BuildingDao()) {
    super();
  }

  public async countBuilding(): Promise<number> {
    try {
      const count = await this.buildingDao.countBuilding();
      this.logInfo("📊 Building count fetched", { count });
      return count;
    } catch (error) {
      this.logError("❌ Error in countBuilding", error);
      throw error;
    }
  }

  public async getBuilding(page: number, limit: number): Promise<Building[]> {
    const cacheKey = `building:all:${page}:${limit}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
        if (Array.isArray(parsed.buildingData)) return parsed.buildingData; // fallback legacy
        return [];
      }

      const data = await this.buildingDao.getBuilding(page, limit);
      await redis.set(cacheKey, JSON.stringify(data), "EX", 60);
      this.logInfo("📤 Building data retrieved and cached", {
        count: data.length,
        page,
        limit,
      });

      return data;
    } catch (error) {
      this.logError("❌ Error in getBuilding", error);
      throw error;
    }
  }

  // public async getBuildingById(building_id: number): Promise<Building | null> {
  //   try {
  //     const [building] = await this.buildingDao.getBuildingById(building_id);
  //     return building || null;
  //   } catch (error) {
  //     this.logError("❌ Error in getBuildingById", error);
  //     throw error;
  //   }
  // }

  // public async searchBuilding(keyword: string): Promise<Building[]> {
  //   try {
  //     const sanitized = keyword.trim().toLowerCase();
  //     const results = await this.buildingDao.searchBuildingByName(sanitized);
  //     this.logInfo("🔍 Building search", { keyword, count: results.length });
  //     return results;
  //   } catch (error) {
  //     this.logError("❌ Error in searchBuilding", error);
  //     throw error;
  //   }
  // }

  // public async getBuildingsByFaculty(faculty_id: number): Promise<Building[]> {
  //   try {
  //     const results = await this.buildingDao.getBuildingsByFaculty(faculty_id);
  //     this.logInfo("🏢 Filtered buildings by faculty", {
  //       faculty_id,
  //       count: results.length,
  //     });
  //     return results;
  //   } catch (error) {
  //     this.logError("❌ Error in getBuildingsByFaculty", error);
  //     throw error;
  //   }
  // }

  public async addBuilding(
    faculty_id: number,
    building_name: string
  ): Promise<Building | null> {
    const cacheKey = "building:all";

    try {
      const existing = await this.buildingDao.getBuildingByName(building_name);
      if (existing.length > 0) {
        this.logInfo("🚫 Duplicate building name", { building_name });
        return null;
      }

      const created = await this.buildingDao.addBuilding(
        faculty_id,
        building_name
      );
      await redis.del(cacheKey);
      this.logInfo("🆕 Building created", { building_id: created.building_id });

      return created;
    } catch (error) {
      this.logError("❌ Error in addBuilding", error);
      throw error;
    }
  }

  public async updatedBuildingByName(
    building_id: number,
    faculty_id: number,
    building_name: string
  ): Promise<Building | null> {
    const cacheKey = "building:all";

    try {
      const existing = await this.buildingDao.getBuildingByName(building_name);
      const isDuplicate = existing.some(
        (b) =>
          b.building_id !== building_id && b.building_name === building_name
      );

      if (isDuplicate) {
        this.logInfo("🚫 Building name already used by another ID", {
          building_name,
          building_id,
        });
        return null;
      }

      const updated = await this.buildingDao.updatedBuildingByName(
        building_id,
        faculty_id,
        building_name
      );

      await redis.del(cacheKey);
      this.logInfo("✏️ Building updated", { building_id });

      return updated;
    } catch (error) {
      this.logError("❌ Error in updatedBuildingByName", error);
      throw error;
    }
  }

  public async deletedBuilding(building_id: number): Promise<boolean> {
    const cacheKey = "building:all";

    try {
      const deleted = await this.buildingDao.deletedBuilding(building_id);
      await redis.del(cacheKey);

      if (deleted) {
        this.logInfo("🗑️ Building deleted", { building_id });
      }

      return !!deleted;
    } catch (error) {
      this.logError("❌ Error in deletedBuilding", error);
      throw error;
    }
  }
}
