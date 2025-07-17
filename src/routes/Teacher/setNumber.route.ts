import { Router } from "express";
import { wrapAsync } from "../../utils/wrapAsync";
import { SetNumberController } from "../../controllers/Teacher/setNumber.controller";
import { SetNumberService } from "../../services/Teacher/setNumber.service";
import { verifyToken } from "../../middleware/verifyToken";
// import { validateDTO } from "../../middleware/validateDTO.validator";
// import { CreateSetNumberDto } from "../../dtos/setNumber/create-setNumber.dto";
// import { UpdateSetNumberDto } from "../../dtos/setNumber/update-setNumber.dto";

const router = Router();

// ✅ สร้าง instance ของ service และ controller
const setNumberService = new SetNumberService();
const setNumberController = new SetNumberController(setNumberService);

// ✅ GET /get-set-numbers → ดึงข้อมูลชุดคำถามแบบแบ่งหน้า
// router.get(
//   "/get-set-numbers",
//   verifyToken,
//   wrapAsync((req, res) => setNumberController.getAll(req, res))
// );

// ✅ GET /count → จำนวนชุดคำถามทั้งหมด
// router.get("/count", verifyToken, wrapAsync(setNumberController.count));

// ✅ POST /create-set-number → เพิ่มชุดคำถาม
router.post(
  "/create-set-number",
  verifyToken,
  // validateDTO(CreateSetNumberDto),
  wrapAsync((req, res) => setNumberController.create(req, res))
);

// ✅ PUT /update-set-number/:set_number_id → แก้ไขชุดคำถาม
// router.put(
//   "/update-set-number/:set_number_id",
//   verifyToken,
//   // validateDTO(UpdateSetNumberDto),
//   wrapAsync((req, res) => setNumberController.update(req, res))
// );

// // ✅ DELETE /delete-set-number/:set_number_id → ลบชุดคำถาม
// router.delete(
//   "/delete-set-number/:set_number_id",
//   verifyToken,
//   wrapAsync((req, res) => setNumberController.delete(req, res))
// );

export default router;
