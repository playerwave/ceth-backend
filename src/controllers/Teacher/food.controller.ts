// // src/controllers/food.controller.ts
// import { Request, Response } from "express";
// import { FoodService } from "../../services/Teacher/food.service";
// import { ErrorHandledController } from "../error.handled.controller";
// import xss from "xss";

// export class FoodController extends ErrorHandledController {
//   constructor(private readonly foodService: FoodService = new FoodService()) {
//     super();
//   }

//   public async count(req: Request, res: Response): Promise<void> {
//     try {
//       const result = await this.foodService.countFood();
//       res.status(200).json(result);
//     } catch (error) {
//       this.handleError("FoodController.count", error, res);
//     }
//   }

//   public async getAll(req: Request, res: Response): Promise<void> {
//     const page = parseInt(req.query.page as string, 10) || 1;
//     const limit = parseInt(req.query.limit as string, 10) || 10;

//     try {
//       const result = await this.foodService.getFood(page, limit);
//       res.status(200).json(result);
//     } catch (error) {
//       this.handleError("FoodController.getAll", error, res);
//     }
//   }

//   public async create(req: Request, res: Response): Promise<void> {
//     try {
//       const data = this.parseFoodPayload(req.body);
//       const created = await this.foodService.addFood(
//         data.food_name,
//         data.status,
//         data.faculty_id
//       );

//       if (created) {
//         res.status(201).json({
//           message: "เพิ่มอาหารสำเร็จ!",
//           food: created,
//         });
//       } else {
//         res.status(409).json({ message: "มีอาหารนี้อยู่ในระบบแล้ว!" });
//       }
//     } catch (error) {
//       this.handleError("FoodController.create", error, res);
//     }
//   }

//   public async update(req: Request, res: Response): Promise<void> {
//     try {
//       const food_id = this.parseId(req.params.food_id);
//       const data = this.parseFoodPayload(req.body);

//       const updated = await this.foodService.updatedFood(
//         food_id,
//         data.food_name,
//         data.status,
//         data.faculty_id
//       );

//       if (updated) {
//         res.status(200).json({
//           message: "แก้อาหารสำเร็จ!",
//           updated,
//         });
//       } else {
//         res.status(404).json({ message: "มีอาหารนี้อยู่ในระบบแล้ว!" });
//       }
//     } catch (error) {
//       this.handleError("FoodController.update", error, res);
//     }
//   }

//   public async delete(req: Request, res: Response): Promise<void> {
//     try {
//       const food_id = this.parseId(req.params.food_id);
//       const deleted = await this.foodService.deletedFood(food_id);

//       if (deleted) {
//         res.status(200).json({ message: "ลบอาหารสำเร็จ!" });
//       } else {
//         res.status(404).json({ message: "ไม่พบข้อมูลอาหารที่ต้องการลบ!" });
//       }
//     } catch (error) {
//       this.handleError("FoodController.delete", error, res);
//     }
//   }

//   // 🔧 Utils
//   private parseId(value: string): number {
//     const id = parseInt(xss(value), 10);
//     if (isNaN(id)) throw new Error("Invalid ID format");
//     return id;
//   }

//   private sanitize(input: string): string {
//     return xss(input);
//   }

//   private parseFoodPayload(body: any): {
//     food_name: string;
//     status: string;
//     faculty_id: number;
//   } {
//     return {
//       food_name: this.sanitize(body.food_name),
//       status: this.sanitize(body.status),
//       faculty_id: this.parseId(this.sanitize(body.faculty_id)),
//     };
//   }
// }

// src/controllers/Teacher/food.controller.ts
import { Request, Response } from "express";
import { FoodService } from "../../services/Teacher/food.service";
import { ErrorHandledController } from "../error.handled.controller";
import xss from "xss";

export class FoodController extends ErrorHandledController {
  constructor(private readonly foodService: FoodService) {
    super();
  }

  public async count(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.foodService.countFood();
      res.status(200).json(result);
    } catch (error) {
      this.handleError("FoodController.count", error, res);
    }
  }

  // public async getAll(req: Request, res: Response): Promise<void> {
  //   try {
  //     const page = parseInt(req.query.page as string, 10) || 1;
  //     const limit = parseInt(req.query.limit as string, 10) || 10;
  //     const result = await this.foodService.getFood(page, limit);
  //     res.status(200).json(result);
  //   } catch (error) {
  //     this.handleError("FoodController.getAll", error, res);
  //   }
  // }

  // public async getAll(req: Request, res: Response): Promise<void> {
  //   try {
  //     const page = parseInt(req.query.page as string, 10) || 1;
  //     const limit = parseInt(req.query.limit as string, 10) || 10;
  //     // const result = await this.foodService.getFood(page, limit);

  //     const result = await this.foodService.getFood(page, limit);

  //     // ✅ ตอบเฉพาะ foodData
  //     res.status(200).json(result);
  //   } catch (error) {
  //     this.handleError("FoodController.getAll", error, res);
  //   }
  // }

  public async getAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;

      const foods = await this.foodService.getFood(page, limit);
      res.status(200).json(foods); // ✅ ส่ง array ล้วน
    } catch (error) {
      this.handleError("FoodController.getAll", error, res);
    }
  }

  public async getOne(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.food_id);
      const food = await this.foodService.getFoodById(id);
      res.status(200).json(food);
    } catch (error) {
      this.handleError("FoodController.getOne", error, res);
    }
  }

  public async create(req: Request, res: Response): Promise<void> {
    try {
      const data = this.parseFoodPayload(req.body);
      const created = await this.foodService.addFood(
        data.food_name,
        data.status,
        data.faculty_id
      );

      if (created) {
        res.status(201).json({
          message: "เพิ่มอาหารสำเร็จ!",
          food: created,
        });
      } else {
        res.status(409).json({ message: "มีอาหารนี้อยู่ในระบบแล้ว!" });
      }
    } catch (error) {
      this.handleError("FoodController.create", error, res);
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const food_id = this.parseId(req.params.food_id);
      const data = this.parseFoodPayload(req.body);

      const updated = await this.foodService.updatedFood(
        food_id,
        data.food_name,
        data.status,
        data.faculty_id
      );

      if (updated) {
        res.status(200).json({
          message: "แก้อาหารสำเร็จ!",
          updated,
        });
      } else {
        res.status(409).json({
          message: "มีอาหารนี้อยู่ในระบบแล้ว หรือไม่พบอาหารที่ต้องการแก้ไข!",
        });
      }
    } catch (error) {
      this.handleError("FoodController.update", error, res);
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const food_id = this.parseId(req.params.food_id);
      const deleted = await this.foodService.deletedFood(food_id);

      if (deleted) {
        res.status(200).json({ message: "ลบอาหารสำเร็จ!" });
      } else {
        res.status(404).json({ message: "ไม่พบข้อมูลอาหารที่ต้องการลบ!" });
      }
    } catch (error) {
      this.handleError("FoodController.delete", error, res);
    }
  }

  // 🔧 Utils
  private parseId(value: string): number {
    const id = parseInt(xss(value), 10);
    if (isNaN(id)) throw new Error("Invalid ID format");
    return id;
  }

  private sanitize(input: string): string {
    return xss(input);
  }

  private parseFoodPayload(body: any): {
    food_name: string;
    status: string;
    faculty_id: number;
  } {
    return {
      food_name: this.sanitize(body.food_name),
      status: this.sanitize(body.status),
      faculty_id: this.parseId(this.sanitize(body.faculty_id)),
    };
  }
}
