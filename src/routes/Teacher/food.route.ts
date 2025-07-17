// src/routes/Teacher/food.route.ts
import { Router } from "express";
import { wrapAsync } from "../../utils/wrapAsync";
import { FoodController } from "../../controllers/Teacher/food.controller";
import { FoodService } from "../../services/Teacher/food.service";
import { FacultyService } from "../../services/faculty.service";
import { verifyToken } from "../../middleware/verifyToken";
import { Admin } from "../../middleware/CheckRole";
// import { validateDTO } from "../../middleware/validateDTO.validator";
// import { CreateFoodDto } from "../../dtos/food/create-food.dto";
// import { UpdateFoodDto } from "../../dtos/food/update-food.dto";

const router = Router();

// ✅ สร้าง instance ของ service และ controller
const foodService = new FoodService();
const foodController = new FoodController(foodService);
const facultyService = new FacultyService();

// 🧠 interface สำหรับ JWT user (เหมือน auth route)
interface JwtUser {
  users_id: number;
  roles_id: number;
}

// ✅ GET /get-foods → รวมข้อมูลอาหาร + faculty + user
// router.get(
//   "/get-foods",
//   verifyToken,
//   wrapAsync(async (req, res) => {
//     const user = req.user as JwtUser;
//     const page = parseInt(req.query.page as string, 10) || 1;
//     const limit = parseInt(req.query.limit as string, 10) || 10;

//     const foodData = await foodService.getFood(page, limit);
//     const countFood = await foodService.countFood();
//     const facultyData = await facultyService.getFaculty(1, 100);

//     res.setHeader("Cache-Control", "no-store");
//     res.status(200).json({
//       page: "อาหาร",
//       user,
//       foodData,
//       countFood,
//       facultyData,
//       notification: "เชื่อมต่อข้อมูลอาหารสำเร็จ",
//     });
//   })
// );

router.get(
  "/get-foods",
  verifyToken,
  wrapAsync(foodController.getAll.bind(foodController))
);

// ✅ GET /count → จำนวนอาหารทั้งหมด
router.get("/count", verifyToken, wrapAsync(foodController.count));

// ✅ POST /create-food → เพิ่มอาหาร
router.post(
  "/create-food",
  verifyToken,
  // validateDTO(CreateFoodDto),
  wrapAsync((req, res) => foodController.create(req, res))
);

// ✅ PUT /update-food/:food_id → แก้ไขอาหาร
router.put(
  "/update-food/:food_id",
  verifyToken,
  // validateDTO(UpdateFoodDto),
  wrapAsync(foodController.update)
);

// ✅ DELETE /delete-food/:food_id → ลบอาหาร
router.delete(
  "/delete-food/:food_id",
  verifyToken,
  wrapAsync(foodController.delete)
);

export default router;
