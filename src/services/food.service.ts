import { FoodDao } from "../daos/Admin/food.dao";
import { Food } from "../interfaces/Food";

export class FoodService {
  private foodDao = new FoodDao();

  async getAllFoods(): Promise<Food[]> {
    return this.foodDao.getAllFoods();
  }

  async getFoodById(id: number): Promise<Food | null> {
    return this.foodDao.getFoodById(id);
  }
}
