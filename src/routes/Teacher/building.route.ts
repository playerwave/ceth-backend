import { Router } from "express";
import { BuildingController } from "../../controllers/Teacher/building.controller.teacher";
import { BuildingService } from "../../services/Teacher/building.service";
import { BuildingDao } from "../../daos/Teacher/building.dao";
import { wrapAsync } from "../../utils/wrapAsync";
import { verifyToken } from "../../middleware/verifyToken";
import { Admin } from "../../middleware/CheckRole";
import { validateDTO } from "../../middleware/validateDTO.validator";
import { CreateBuildingDto } from "../../dtos/building/create-building.dto";
import { UpdateBuildingDto } from "../../dtos/building/update-building.dto";

const router = Router();

// ✅ สร้าง instance DAO และ Service
const buildingDao = new BuildingDao();
const buildingService = new BuildingService(buildingDao);
const buildingController = new BuildingController(buildingService);

// ✅ GET buildings
router.get(
  "/get-buildings",
  verifyToken,
  wrapAsync(buildingController.getAll.bind(buildingController))
);

// ✅ GET count
router.get(
  "/count",
  verifyToken,
  wrapAsync(buildingController.count.bind(buildingController))
);

// ✅ POST เพิ่มตึก
router.post(
  "/create-building",
  verifyToken,
  validateDTO(CreateBuildingDto),
  wrapAsync(buildingController.create.bind(buildingController))
);

// ✅ PUT แก้ไขชื่อตึก
router.put(
  "/update-building/:building_id",
  verifyToken,
  validateDTO(UpdateBuildingDto),
  wrapAsync(buildingController.update.bind(buildingController))
);

// ✅ DELETE ลบตึก
router.delete(
  "/delete-building/:building_id",
  verifyToken,
  wrapAsync(buildingController.delete.bind(buildingController))
);

export default router;
