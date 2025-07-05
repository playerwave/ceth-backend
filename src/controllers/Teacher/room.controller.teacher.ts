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

  public async getAll(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.roomService.getRoom();
      res.status(200).json(result);
    } catch (error) {
      this.handleError("RoomController.getAll", error, res);
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
          message: "เพิ่มชื่อห้องสำเร็จ !",
          room: created,
        });
      } else {
        res.status(409).json({
          message: "มีชื่อห้องนี้อยู่ในระบบแล้ว !",
        });
      }
    } catch (error) {
      this.handleError("RoomController.create", error, res);
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const room_id = this.parseId(req.params.room_id);
      const data = this.parseRoomPayload(req.body);

      const updatedRoom = await this.roomService.updatedRoom(
        room_id,
        data.faculty_id,
        data.building_id,
        data.room_name,
        data.floor,
        data.seat_number,
        data.status
      );

      if (updatedRoom) {
        res.status(200).json({
          message: "แก้ข้อมูลห้องสำเร็จ !",
          updated: updatedRoom,
        });
      } else {
        res.status(404).json({
          message: "ไม่พบข้อมูลห้องที่จะอัปเดต !",
        });
      }
    } catch (error) {
      this.handleError("RoomController.update", error, res);
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const room_id = this.parseId(req.params.room_id);
      const result = await this.roomService.deleteRoom(room_id);

      if (result === "soft") {
        res
          .status(200)
          .json({ message: "ห้องถูกปิดใช้งาน (Soft Delete) เรียบร้อยแล้ว" });
      } else if (result === "hard") {
        res
          .status(200)
          .json({ message: "ลบข้อมูลห้องออกจากระบบ (Hard Delete) สำเร็จแล้ว" });
      } else {
        res.status(404).json({ message: "ไม่พบข้อมูลห้องที่ต้องการลบ !" });
      }
    } catch (error) {
      this.handleError("RoomController.delete", error, res);
    }
  }

  // 🔧 Utils
  private parseId(value: string): number {
    const id = parseInt(value, 10);
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
