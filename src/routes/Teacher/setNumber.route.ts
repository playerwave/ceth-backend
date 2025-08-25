import { Router } from "express";
import { wrapAsync } from "../../utils/wrapAsync";
import { SetNumberController } from "../../controllers/Teacher/setNumber.controller";
import { SetNumberService } from "../../services/Teacher/setNumber.service";
import { verifyToken } from "../../middleware/verifyToken";
import { validateDTO } from "../../middleware/validateDTO.validator";
import { CreateSetNumberDto } from "../../dtos/setNumber/create-set-number.dto";
import { UpdateSetNumberDto } from "../../dtos/setNumber/update-set-number.dto";

const router = Router();

// ✅ สร้าง instance ของ service และ controller
const setNumberService = new SetNumberService();
const setNumberController = new SetNumberController(setNumberService);

// ✅ GET /get-set-numbers → ดึงข้อมูลชุดคำถามแบบแบ่งหน้า
router.get(
  "/get-set-numbers",
  verifyToken,
  wrapAsync((req, res) => setNumberController.getAll(req, res))
);

// ✅ GET /get-set-number/:id → ดึงข้อมูลชุดคำถามตาม ID
router.get(
  "/get-set-number/:id",
  verifyToken,
  wrapAsync((req, res) => setNumberController.getById(req, res))
);

// ✅ POST /create-set-number → เพิ่มชุดคำถาม
router.post(
  "/create-set-number",
  verifyToken,
  validateDTO(CreateSetNumberDto),
  wrapAsync((req, res) => setNumberController.create(req, res))
);

// ✅ PUT /update-set-number/:id → แก้ไขชุดคำถาม
router.put(
  "/update-set-number/:id",
  verifyToken,
  validateDTO(UpdateSetNumberDto),
  wrapAsync((req, res) => setNumberController.update(req, res))
);

// ✅ DELETE /delete-set-number/:id → ลบชุดคำถาม
router.delete(
  "/delete-set-number/:id",
  verifyToken,
  wrapAsync((req, res) => setNumberController.delete(req, res))
);

export default router;
