// src/services/Teacher/food.service.ts

import redis from "../../config/redis";
import { FoodDao } from "../../daos/Teacher/food.dao";
import { Food } from "../../entity/food.entity";
import { ErrorHandledService } from "../error.handdled.service";

export class FoodService extends ErrorHandledService {
  constructor(private readonly foodDao = new FoodDao()) {
    super();
  }

  public async countFood(): Promise<number> {
    try {
      const count = await this.foodDao.countFood();
      this.logInfo("📊 Food count fetched", { count });
      return count;
    } catch (error) {
      this.logError("❌ Error in countFood", error);
      throw error;
    }
  }

  // public async getFood(page: number, limit: number): Promise<Food[]> {
  //   const cacheKey = `food:all:${page}:${limit}`;

  //   try {
  //     const cached = await redis.get(cacheKey);
  //     if (cached) {
  //       this.logInfo("📦 Returning cached food data");
  //       return JSON.parse(cached);
  //     }

  //     const data = await this.foodDao.getFood(page, limit);
  //     await redis.set(cacheKey, JSON.stringify(data), "EX", 60);
  //     this.logInfo("📤 Food data retrieved and cached", {
  //       page,
  //       limit,
  //       count: data.length,
  //     });

  //     return data;
  //   } catch (error) {
  //     this.logError("❌ Error in getFood", error);
  //     throw error;
  //   }
  // }

  public async getFood(page: number, limit: number): Promise<Food[]> {
    const cacheKey = `food:all:${page}:${limit}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);

        // ✅ ใช้เฉพาะ array ไม่ดึง foodData object
        if (Array.isArray(parsed)) return parsed;
        if (Array.isArray(parsed.foodData)) return parsed.foodData; // รองรับ cache เก่า
        return []; // fallback
      }

      const data = await this.foodDao.getFood(page, limit); // ✅ DAO return เป็น Food[]
      await redis.set(cacheKey, JSON.stringify(data), "EX", 60); // cache array ล้วน
      return data;
    } catch (error) {
      this.logError("❌ Error in getFood", error);
      throw error;
    }
  }

  public async getFoodById(food_id: number): Promise<Food | null> {
    try {
      const found = await this.foodDao.getFoodByID(food_id);
      if (!found.length) {
        this.logInfo("❌ Food not found", { food_id });
        return null;
      }

      const food = found[0];
      this.logInfo("🍽️ Food retrieved", { food_id });
      return food;
    } catch (error) {
      this.logError("❌ Error in getFoodById", error);
      throw error;
    }
  }

  public async addFood(
    food_name: string,
    status: string,
    faculty_id: number
  ): Promise<Food | null> {
    const cacheKey = "food:all";
    try {
      const exists = await this.foodDao.getFoodByName(food_name);
      if (exists.length > 0) {
        this.logInfo("🚫 Duplicate food name", { food_name });
        return null;
      }

      const created = await this.foodDao.addFood(food_name, status, faculty_id);
      await redis.del(cacheKey);
      this.logInfo("🆕 Food created", { food_id: created.food_id });

      return created;
    } catch (error) {
      this.logError("❌ Error in addFood", error);
      throw error;
    }
  }

  public async updatedFood(
    food_id: number,
    food_name: string,
    status: string,
    faculty_id: number
  ): Promise<Food | null> {
    const cacheKey = "food:all";
    try {
      const found = await this.foodDao.getFoodByID(food_id);
      if (!found.length) {
        this.logInfo("❌ Food not found", { food_id });
        return null;
      }

      const currentName = found[0].food_name;
      let updated: Food | null = null;

      if (food_name === currentName) {
        await this.foodDao.updatedFoodByNotName(food_id, status, faculty_id);
      } else {
        const dup = await this.foodDao.getFoodByName(food_name);
        if (dup.length > 0) {
          this.logInfo("🚫 Duplicate new food name", { food_name });
          return null;
        }
        await this.foodDao.updatedFoodByName(
          food_id,
          food_name,
          status,
          faculty_id
        );
      }

      await redis.del(cacheKey);
      const [result] = await this.foodDao.getFoodByID(food_id);
      this.logInfo("✏️ Food updated", { food_id });
      return result || null;
    } catch (error) {
      this.logError("❌ Error in updatedFood", error);
      throw error;
    }
  }

  public async deletedFood(food_id: number): Promise<Food | null> {
    const cacheKey = "food:all";
    try {
      const deleted = await this.foodDao.deletedFood(food_id);
      await redis.del(cacheKey);

      if (!deleted) {
        this.logInfo("❌ No food deleted", { food_id });
        return null;
      }

      this.logInfo("🗑️ Food deleted", { food_id });
      return deleted;
    } catch (error) {
      this.logError("❌ Error in deletedFood", error);
      throw error;
    }
  }
}
