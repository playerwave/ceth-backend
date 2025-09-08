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
  ((req, res) => setNumberController.getAll(req, res))
);

router.get(
  "/get-set-numbers-by-assessment/:assessment_id",
  ((req, res) => setNumberController.getSetNumbersByAssessmentID(req, res))
);

// // ✅ POST /create-set-number → เพิ่มชุดคำถาม
router.post(
  "/create-set-number", ((req, res) => setNumberController.create(req, res))
);

//duplicate
router.post(
  "/duplicate-set-number/:set_number_id",
  (req, res) => setNumberController.duplicate(req, res)
);



// ✅ PUT /update-set-number/:id → แก้ไขชุดคำถาม
router.put(
  "/update-set-number/:set_number_id", ((req, res) => setNumberController.update(req, res))
);

// ✅ DELETE /delete-set-number/:id → ลบชุดคำถาม
router.delete(
  "/delete-set-number/:set_number_id",((req, res) => setNumberController.delete(req, res))
);

export default router;
