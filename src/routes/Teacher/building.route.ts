// import { Router } from "express";
// import { BuildingController } from "../../controllers/Teacher/building.controller.teacher";

// import { BuildingService } from "../../services/Teacher/building.service";
// import { FacultyService } from "../../services/faculty.service";
// import { BuildingDao } from "../../daos/Teacher/building.dao";

// import { wrapAsync } from "../../utils/wrapAsync";
// import { verifyToken } from "../../middleware/verifyToken";
// import { Admin } from "../../middleware/CheckRole";
// import { validateDTO } from "../../middleware/validateDTO.validator";

// import { CreateBuildingDto } from "../../dtos/building/create-building.dto";
// import { UpdateBuildingDto } from "../../dtos/building/update-building.dto";

// const router = Router();

// // ✅ สร้าง instance DAO และ Service
// const buildingDao = new BuildingDao();
// const buildingService = new BuildingService(buildingDao);
// const buildingController = new BuildingController(buildingService);
// const facultyService = new FacultyService();

// // ✅ GET buildings
// router.get(
//   "/get-buildings",
//   verifyToken,
//   wrapAsync(async (req, res) => {
//     const user = req.user;

//     const page = parseInt(req.query.page as string) || 1;
//     const limit = parseInt(req.query.limit as string) || 10;

//     const [buildingData, countBuilding, facultyData] = await Promise.all([
//       buildingService.getBuilding(page, limit),
//       buildingService.countBuilding(),
//       facultyService.getFaculty(1, 100),
//     ]);

//     if (req.isAuthenticated()) {
//       res.status(200).json({
//         page: "ตึก",
//         user,
//         buildingData,
//         countBuilding,
//         facultyData,
//         notification: "The data connection was successful.",
//       });
//     } else {
//       res.status(401).json({
//         page: "ตึก",
//         user: null,
//         notification: "Error fetching Building data",
//       });
//     }
//   })
// );

// // ✅ POST เพิ่มตึก
// router.post(
//   "/add",
//   verifyToken,
//   validateDTO(CreateBuildingDto),
//   wrapAsync(buildingController.create.bind(buildingController))
// );

// // ✅ PUT แก้ไขชื่อตึก
// router.put(
//   "/edit/:building_id",
//   verifyToken,
//   validateDTO(UpdateBuildingDto),
//   wrapAsync(buildingController.update.bind(buildingController))
// );

// // ✅ DELETE ลบตึก
// router.delete(
//   "/delete/:building_id",
//   verifyToken,
//   wrapAsync(buildingController.delete.bind(buildingController))
// );

// export default router;

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
  "/add",
  verifyToken,
  Admin,
  validateDTO(CreateBuildingDto),
  wrapAsync(buildingController.create.bind(buildingController))
);

// ✅ PUT แก้ไขชื่อตึก
router.put(
  "/edit/:building_id",
  verifyToken,
  Admin,
  validateDTO(UpdateBuildingDto),
  wrapAsync(buildingController.update.bind(buildingController))
);

// ✅ DELETE ลบตึก
router.delete(
  "/delete/:building_id",
  verifyToken,
  Admin,
  wrapAsync(buildingController.delete.bind(buildingController))
);

export default router;
