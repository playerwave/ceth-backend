// import { Router, Request, Response } from "express";
// import { RoomService } from "../../services/Teacher/room.service";
// import { RoomController } from "../../controllers/Teacher/room.controller.teacher";
// import { RoomDao } from "../../daos/Teacher/room.dao";

// import { FacultyService } from "../../services/faculty.service";
// import { BuildingService } from "../../services/Teacher/building.service";
// import { Admin } from "../../middleware/CheckRole";
// import { wrapAsync } from "../../utils/wrapAsync";
// import { validateDTO } from "../../middleware/validateDTO.validator";
// import { CreateRoomDto } from "../../dtos/room/create-room.dto";
// import { UpdateRoomDto } from "../../dtos/room/update-room.dto";

// const router = Router();

// const roomDao = new RoomDao();
// const roomService = new RoomService(roomDao);
// const roomController = new RoomController(roomService);

// const buildingService = new BuildingService();

// // GET METHOD: Get room data
// router.get(
//   "/get-rooms",
//   wrapAsync(async (req: Request, res: Response) => {
//     const user = req.user;

//     const roomData = await roomService.getRoom();
//     const countRoom = await roomService.countRoom();
//     const facultyService = new FacultyService();
//     const facultyData = await facultyService.getFaculty(1, 100);
//     const buildingData = await buildingService.getBuilding(10, 0);

//     if (req.isAuthenticated()) {
//       res.status(200).json({
//         page: "ห้อง",
//         user,
//         roomData,
//         countRoom,
//         facultyData,
//         buildingData,
//         notification: "The data connection was successful.",
//       });
//     } else {
//       res.status(401).json({
//         page: "ห้อง",
//         user: null,
//         notification: "Error fetching Room data",
//       });
//     }
//   })
// );

// // POST METHOD: Create room
// router.post(
//   "/create-room",
//   Admin,
//   validateDTO(CreateRoomDto),
//   wrapAsync(roomController.create.bind(roomController))
// );

// // PUT METHOD: Update room
// router.put(
//   "/update-room/:room_id",
//   Admin,
//   validateDTO(UpdateRoomDto),
//   wrapAsync(roomController.update.bind(roomController))
// );

// // DELETE METHOD: Delete room
// router.delete(
//   "/delete-room/:room_id",
//   Admin,
//   wrapAsync(roomController.delete.bind(roomController))
// );

// export default router;

// src/routes/Teacher/room.route.ts
import { Router } from "express";
import { RoomService } from "../../services/Teacher/room.service";
import { RoomController } from "../../controllers/Teacher/room.controller.teacher";
import { RoomDao } from "../../daos/Teacher/room.dao";
import { FacultyService } from "../../services/faculty.service";
import { BuildingService } from "../../services/Teacher/building.service";
import { wrapAsync } from "../../utils/wrapAsync";
import { validateDTO } from "../../middleware/validateDTO.validator";
import { CreateRoomDto } from "../../dtos/room/create-room.dto";
import { UpdateRoomDto } from "../../dtos/room/update-room.dto";
import { verifyToken } from "../../middleware/verifyToken";
import { Admin } from "../../middleware/CheckRole";

const router = Router();

// ✅ สร้าง instance ของ service และ controller
const roomDao = new RoomDao();
const roomService = new RoomService(roomDao);
const roomController = new RoomController(roomService);
const facultyService = new FacultyService();
const buildingService = new BuildingService();

// 🧠 interface สำหรับ JWT user
interface JwtUser {
  users_id: number;
  roles_id: number;
}

// ✅ GET /get-rooms → รวมข้อมูลห้อง + faculty + building + user
// router.get(
//   "/get-rooms",
//   verifyToken,
//   wrapAsync(async (req, res) => {
//     const user = req.user as JwtUser;
//     const roomData = await roomService.getRoom();
//     const countRoom = await roomService.countRoom();
//     const facultyData = await facultyService.getFaculty(1, 100);
//     const buildingData = await buildingService.getBuilding(10, 0);

//     res.setHeader("Cache-Control", "no-store");
//     res.status(200).json({
//       page: "ห้อง",
//       user,
//       roomData,
//       countRoom,
//       facultyData,
//       buildingData,
//       notification: "เชื่อมต่อข้อมูลห้องสำเร็จ",
//     });
//   })
// );

router.get(
  "/get-rooms",
  verifyToken,
  wrapAsync(roomController.getAll.bind(roomController))
);

// ✅ GET /count → จำนวนห้องทั้งหมด
router.get("/count", verifyToken, wrapAsync(roomController.count));

// ✅ POST /create-room → เพิ่มห้อง
router.post(
  "/create-room",
  verifyToken,
  validateDTO(CreateRoomDto),
  wrapAsync(roomController.create.bind(roomController))
);

// ✅ PUT /update-room/:room_id → แก้ไขห้อง
router.put(
  "/update-room/:room_id",
  verifyToken,
  validateDTO(UpdateRoomDto),
  wrapAsync(roomController.update.bind(roomController))
);

// ✅ DELETE /delete-room/:room_id → ลบห้อง
router.delete(
  "/delete-room/:room_id",
  verifyToken,
  wrapAsync(roomController.delete.bind(roomController))
);

export default router;
