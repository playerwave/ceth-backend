import { Router, Request, Response } from "express";
import { RoomService } from "../../services/Teacher/room.service";
import { RoomController } from "../../controllers/Teacher/room.controller.teacher";
import { RoomDao } from "../../daos/Teacher/room.dao";

import { FacultyService } from "../../services/faculty.service";
import { BuildingService } from "../../services/Teacher/building.service";
import { Admin } from "../../middleware/CheckRole";
import { wrapAsync } from "../../utils/wrapAsync";
import { validateDTO } from "../../middleware/validateDTO.validator";
import { CreateRoomDto } from "../../dtos/room/create-room.dto";
import { UpdateRoomDto } from "../../dtos/room/update-room.dto";

const router = Router();

const roomDao = new RoomDao();
const roomService = new RoomService(roomDao);
const roomController = new RoomController(roomService);

const buildingService = new BuildingService();

// GET METHOD: Get room data
router.get(
  "/get-rooms",
  wrapAsync(async (req: Request, res: Response) => {
    const user = req.user;

    const roomData = await roomService.getRoom();
    const countRoom = await roomService.countRoom();
    const facultyService = new FacultyService();
    const facultyData = await facultyService.getFaculty(1, 100);
    const buildingData = await buildingService.getBuilding(10, 0);

    if (req.isAuthenticated()) {
      res.status(200).json({
        page: "ห้อง",
        user,
        roomData,
        countRoom,
        facultyData,
        buildingData,
        notification: "The data connection was successful.",
      });
    } else {
      res.status(401).json({
        page: "ห้อง",
        user: null,
        notification: "Error fetching Room data",
      });
    }
  })
);

// POST METHOD: Create room
router.post(
  "/create-room",
  Admin,
  validateDTO(CreateRoomDto),
  wrapAsync(roomController.create.bind(roomController))
);

// PUT METHOD: Update room
router.put(
  "/update-room/:room_id",
  Admin,
  validateDTO(UpdateRoomDto),
  wrapAsync(roomController.update.bind(roomController))
);

// DELETE METHOD: Delete room
router.delete(
  "/delete-room/:room_id",
  Admin,
  wrapAsync(roomController.delete.bind(roomController))
);

export default router;
