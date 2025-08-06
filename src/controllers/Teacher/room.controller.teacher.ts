// import { Request, Response } from "express";
// import { RoomService } from "../../services/Teacher/room.service";
// import { ErrorHandledController } from "../error.handled.controller";
// import xss from "xss";

// export class RoomController extends ErrorHandledController {
//   constructor(private readonly roomService: RoomService) {
//     super();
//   }

//   public async count(req: Request, res: Response): Promise<void> {
//     try {
//       const result = await this.roomService.countRoom();
//       res.status(200).json(result);
//     } catch (error) {
//       this.handleError("RoomController.count", error, res);
//     }
//   }

//   public async getAll(req: Request, res: Response): Promise<void> {
//     try {
//       const result = await this.roomService.getRoom();
//       res.status(200).json(result);
//     } catch (error) {
//       this.handleError("RoomController.getAll", error, res);
//     }
//   }

//   public async create(req: Request, res: Response): Promise<void> {
//     try {
//       const data = this.parseRoomPayload(req.body);

//       const created = await this.roomService.addRoom(
//         data.faculty_id,
//         data.building_id,
//         data.room_name,
//         data.floor,
//         data.seat_number,
//         data.status
//       );

//       if (created) {
//         res.status(201).json({
//           message: "เพิ่มชื่อห้องสำเร็จ !",
//           room: created,
//         });
//       } else {
//         res.status(409).json({
//           message: "มีชื่อห้องนี้อยู่ในระบบแล้ว !",
//         });
//       }
//     } catch (error) {
//       this.handleError("RoomController.create", error, res);
//     }
//   }

//   public async update(req: Request, res: Response): Promise<void> {
//     try {
//       const room_id = this.parseId(req.params.room_id);
//       const data = this.parseRoomPayload(req.body);

//       const updatedRoom = await this.roomService.updatedRoom(
//         room_id,
//         data.faculty_id,
//         data.building_id,
//         data.room_name,
//         data.floor,
//         data.seat_number,
//         data.status
//       );

//       if (updatedRoom) {
//         res.status(200).json({
//           message: "แก้ข้อมูลห้องสำเร็จ !",
//           updated: updatedRoom,
//         });
//       } else {
//         res.status(404).json({
//           message: "ไม่พบข้อมูลห้องที่จะอัปเดต !",
//         });
//       }
//     } catch (error) {
//       this.handleError("RoomController.update", error, res);
//     }
//   }

//   public async delete(req: Request, res: Response): Promise<void> {
//     try {
//       const room_id = this.parseId(req.params.room_id);
//       const result = await this.roomService.deleteRoom(room_id);

//       if (result === "soft") {
//         res
//           .status(200)
//           .json({ message: "ห้องถูกปิดใช้งาน (Soft Delete) เรียบร้อยแล้ว" });
//       } else if (result === "hard") {
//         res
//           .status(200)
//           .json({ message: "ลบข้อมูลห้องออกจากระบบ (Hard Delete) สำเร็จแล้ว" });
//       } else {
//         res.status(404).json({ message: "ไม่พบข้อมูลห้องที่ต้องการลบ !" });
//       }
//     } catch (error) {
//       this.handleError("RoomController.delete", error, res);
//     }
//   }

//   // 🔧 Utils
//   private parseId(value: string): number {
//     const id = parseInt(value, 10);
//     if (isNaN(id)) throw new Error("Invalid ID format");
//     return id;
//   }

//   private sanitize(input: string): string {
//     return xss(input);
//   }

//   private parseRoomPayload(body: any): {
//     faculty_id: number;
//     building_id: number;
//     room_name: string;
//     floor: string;
//     seat_number: number;
//     status: string;
//   } {
//     return {
//       faculty_id: this.parseId(this.sanitize(body.faculty_id)),
//       building_id: this.parseId(this.sanitize(body.building_id)),
//       room_name: this.sanitize(body.room_name),
//       floor: this.sanitize(body.floor),
//       seat_number: this.parseId(this.sanitize(body.seat_number)),
//       status: this.sanitize(body.status),
//     };
//   }
// }

// src/controllers/Teacher/room.controller.ts
import { Request, Response } from "express";
import { RoomService } from "../../services/Teacher/room.service";
import { ErrorHandledController } from "../error.handled.controller";
import xss from "xss";

export class RoomController extends ErrorHandledController {
  constructor(private readonly roomService: RoomService) {
    super();
  }

  public async count(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.roomService.countRoom();
      res.status(200).json(result);
    } catch (error) {
      this.handleError("RoomController.count", error, res);
    }
  }

  // public async getAll(req: Request, res: Response): Promise<void> {
  //   try {
  //     const rooms = await this.roomService.getRoom();
  //     res.status(200).json(rooms); // ✅ ส่ง array ล้วน
  //   } catch (error) {
  //     this.handleError("RoomController.getAll", error, res);
  //   }
  // }

  public async getAll(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;

      const rooms = await this.roomService.getRoom(page, limit);
      res.status(200).json(rooms); // ✅ ส่ง array ล้วน
    } catch (error) {
      this.handleError("RoomController.getAll", error, res);
    }
  }

  public async getOne(req: Request, res: Response): Promise<void> {
    try{
      const id = this.parseId(req.params.room_id);
      const room = await this.roomService.getRoomById(id);
      res.status(200).json(room);
    } catch (error) {
      this.handleError("RoomController.getOne", error, res);
    }
  }

  public async create(req: Request, res: Response): Promise<void> {
    try {
      const data = this.parseRoomPayload(req.body);
      const created = await this.roomService.addRoom(
        data.faculty_id,
        data.building_id,
        data.room_name,
        data.floor,
        data.seat_number,
        data.status
      );

      if (created) {
        res.status(201).json({
          message: "เพิ่มห้องสำเร็จ!",
          room: created,
        });
      } else {
        res.status(409).json({ message: "มีห้องนี้อยู่ในระบบแล้ว!" });
      }
    } catch (error) {
      this.handleError("RoomController.create", error, res);
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const room_id = this.parseId(req.params.room_id);
      const data = this.parseRoomPayload(req.body);

      const updated = await this.roomService.updatedRoom(
        room_id,
        data.faculty_id,
        data.building_id,
        data.room_name,
        data.floor,
        data.seat_number,
        data.status
      );

      if (updated) {
        res.status(200).json({
          message: "แก้ไขห้องสำเร็จ!",
          updated,
        });
      } else {
        res.status(409).json({
          message: "มีห้องนี้อยู่ในระบบแล้ว หรือไม่พบห้องที่ต้องการแก้ไข!",
        });
      }
    } catch (error) {
      this.handleError("RoomController.update", error, res);
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const room_id = this.parseId(req.params.room_id);
      const deleted = await this.roomService.deletedRoom(room_id);

      if (deleted === "soft") {
        res.status(200).json({ message: "ปิดใช้งานห้องเรียบร้อยแล้ว!" });
      } else if (deleted === "hard") {
        res.status(200).json({ message: "ลบห้องออกจากระบบสำเร็จ!" });
      } else {
        res.status(404).json({ message: "ไม่พบข้อมูลห้องที่ต้องการลบ!" });
      }
    } catch (error) {
      this.handleError("RoomController.delete", error, res);
    }
  }

  // ✅ GET /available-rooms → ห้องที่ว่างในช่วงเวลาที่กำหนด
  public async getAvailableRooms(req: Request, res: Response): Promise<void> {
    try {
      const { start_activity_date, end_activity_date, exclude_activity_id } =
        req.query;

      if (!start_activity_date || !end_activity_date) {
        res.status(400).json({
          message: "กรุณาระบุวันที่เริ่มและสิ้นสุดกิจกรรม",
        });
        return;
      }

      const rooms = await this.roomService.getAvailableRooms(
        start_activity_date as string,
        end_activity_date as string,
        exclude_activity_id
          ? parseInt(exclude_activity_id as string)
          : undefined
      );

      res.status(200).json({
        message: "ดึงข้อมูลห้องที่ว่างสำเร็จ",
        rooms,
        count: rooms.length,
      });
    } catch (error) {
      this.handleError("RoomController.getAvailableRooms", error, res);
    }
  }

  // ✅ GET /room-conflicts/:room_id → ตรวจสอบห้องที่ถูกใช้งาน
  public async getRoomConflicts(req: Request, res: Response): Promise<void> {
    try {
      const room_id = this.parseId(req.params.room_id);
      const { start_activity_date, end_activity_date, exclude_activity_id } =
        req.query;

      if (!start_activity_date || !end_activity_date) {
        res.status(400).json({
          message: "กรุณาระบุวันที่เริ่มและสิ้นสุดกิจกรรม",
        });
        return;
      }

      const conflicts = await this.roomService.getRoomConflicts(
        room_id,
        start_activity_date as string,
        end_activity_date as string,
        exclude_activity_id ? parseInt(exclude_activity_id as string) : undefined
      );

      res.status(200).json({
        message: "ตรวจสอบห้องที่ถูกใช้งานสำเร็จ",
        room_id,
        conflicts,
        has_conflicts: conflicts.length > 0,
      });
    } catch (error) {
      this.handleError("RoomController.getRoomConflicts", error, res);
    }
  }

  // ✅ GET /all-available-rooms → ห้องที่ว่างทั้งหมด
  public async getAllAvailableRooms(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const rooms = await this.roomService.getAllAvailableRooms();

      res.status(200).json({
        message: "ดึงข้อมูลห้องที่ว่างทั้งหมดสำเร็จ",
        rooms,
        count: rooms.length,
      });
    } catch (error) {
      this.handleError("RoomController.getAllAvailableRooms", error, res);
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

  private parseRoomPayload(body: any): {
    faculty_id: number;
    building_id: number;
    room_name: string;
    floor: string;
    seat_number: number;
    status: string;
  } {
    return {
      faculty_id: this.parseId(this.sanitize(body.faculty_id)),
      building_id: this.parseId(this.sanitize(body.building_id)),
      room_name: this.sanitize(body.room_name),
      floor: this.sanitize(body.floor),
      seat_number: this.parseId(this.sanitize(body.seat_number)),
      status: this.sanitize(body.status),
    };
  }
}
