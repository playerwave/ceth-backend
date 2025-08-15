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
const roomService = new RoomService();
const roomController = new RoomController(roomService);
const facultyService = new FacultyService();
const buildingService = new BuildingService();

// 🧠 interface สำหรับ JWT user
interface JwtUser {
  users_id: number;
  roles_id: number;
}

router.get(
  "/get-rooms",
  verifyToken,
  wrapAsync(roomController.getAll.bind(roomController))
);

// ✅ เพิ่ม route ใหม่สำหรับดึงห้องทั้งหมด
router.get(
  "/get-all-rooms",
  verifyToken,
  wrapAsync(roomController.getAllRooms.bind(roomController))
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

router.get(
  "/get-room/:room_id",
  verifyToken,
  wrapAsync(roomController.getOne.bind(roomController))
);

router.get(
  "/search-rooms",
  verifyToken,
  wrapAsync(roomController.search.bind(roomController))
);

// ✅ DELETE /delete-room/:room_id → ลบห้อง
router.delete(
  "/delete-room/:room_id",
  verifyToken,
  wrapAsync(roomController.delete.bind(roomController))
);

// ✅ GET /available-rooms → ห้องที่ว่างในช่วงเวลาที่กำหนด
router.get(
  "/available-rooms",
  verifyToken,
  wrapAsync(roomController.getAvailableRooms.bind(roomController))
);

// ✅ GET /room-conflicts/:room_id → ตรวจสอบห้องที่ถูกใช้งาน
router.get(
  "/room-conflicts/:room_id",
  verifyToken,
  wrapAsync(roomController.getRoomConflicts.bind(roomController))
);

// ✅ GET /all-available-rooms → ห้องที่ว่างทั้งหมด
router.get(
  "/all-available-rooms",
  verifyToken,
  wrapAsync(roomController.getAllAvailableRooms.bind(roomController))
);

// ✅ GET /room-conflicts/:room_id → ตรวจสอบห้องที่ถูกใช้งาน
router.get(
  "/room-conflicts/:room_id",
  verifyToken,
  wrapAsync(roomController.getRoomConflicts.bind(roomController))
);

export default router;
