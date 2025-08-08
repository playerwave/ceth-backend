import { Request, Response } from "express";
import { BuildingService } from "../../services/Teacher/building.service";
import { ErrorHandledController } from "../error.handled.controller";
import xss from "xss";
import { QuestionService } from "../../services/Teacher/question.service";

export class QuestionController extends ErrorHandledController {
    constructor(private readonly questionService: QuestionService) {
        super();
    }

    public async count(req: Request, res: Response): Promise<void> {
        try {
            const result = await this.questionService.countQuestion();
            res.status(200).json(result);
        } catch (error) {
            this.handleError("QuestionController.count", error, res);
        }
    }

    public async getAll(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string, 10) || 1;
            const limit = parseInt(req.query.limit as string, 10) || 10;

            const question = await this.questionService.getQuestion(page, limit)
            res.status(200).json(question); // ✅ ส่ง array ล้วน
        } catch (error) {
            this.handleError("QuestionController.getAll", error, res);
        }
    }

    // public async create(req: Request, res: Response): Promise<void> {
    //     try {
    //         const data = this.parseBuildingPayload(req.body);
    //         const created = await this.buildingService.addBuilding(
    //             data.faculty_id,
    //             data.building_name
    //         );

    //         if (created) {
    //             res.status(201).json({
    //                 message: "เพิ่มชื่อตึกสำเร็จ!",
    //                 building: created,
    //             });
    //         } else {
    //             res.status(409).json({ message: "มีชื่อตึกนี้อยู่ในระบบแล้ว!" });
    //         }
    //     } catch (error) {
    //         this.handleError("BuildingController.create", error, res);
    //     }
    // }

    // public async update(req: Request, res: Response): Promise<void> {
    //     try {
    //         const building_id = this.parseId(req.params.building_id);
    //         const data = this.parseBuildingPayload(req.body);

    //         const updated = await this.buildingService.updatedBuildingByName(
    //             building_id,
    //             data.faculty_id,
    //             data.building_name
    //         );

    //         if (updated) {
    //             res.status(200).json({
    //                 message: "แก้ไขชื่อตึกสำเร็จ!",
    //                 updated,
    //             });
    //         } else {
    //             res.status(409).json({
    //                 message: "มีชื่อตึกนี้อยู่ในระบบแล้ว หรือไม่พบตึกที่ต้องการแก้ไข!",
    //             });
    //         }
    //     } catch (error) {
    //         this.handleError("BuildingController.update", error, res);
    //     }
    // }

    // public async delete(req: Request, res: Response): Promise<void> {
    //     try {
    //         const building_id = this.parseId(req.params.building_id);
    //         const deleted = await this.buildingService.deletedBuilding(building_id);

    //         if (deleted) {
    //             res.status(200).json({
    //                 message: "ลบชื่อตึกสำเร็จ !",
    //             });
    //         } else {
    //             res.status(404).json({
    //                 message: "ไม่พบข้อมูลตึกที่ต้องการลบ !",
    //             });
    //         }
    //     } catch (error) {
    //         if (
    //             this.isErrorWithMessage(error) &&
    //             error.message.includes("มีห้องที่ผูกอยู่")
    //         ) {
    //             res.status(400).json({ message: error.message });
    //         } else {
    //             this.handleError("BuildingController.delete", error, res);
    //         }
    //     }
    // }

    // 🔍 Type guard เพื่อให้แน่ใจว่า error มี message
    private isErrorWithMessage(error: unknown): error is Error {
        return typeof error === "object" && error !== null && "message" in error;
    }

    // 🧼 Utility methods (เหมือน RoomController)
    private parseId(value: any): number {
        const id = parseInt(xss(value), 10);
        if (isNaN(id)) throw new Error("Invalid ID format");
        return id;
    }

    private sanitize(input: string): string {
        return xss(input);
    }

    private parseOptionalInt(value: any, fallback = 0): number {
        const num = parseInt(value);
        return isNaN(num) ? fallback : num;
    }

    private parseQuestionPayload(body: any): {
        question_id: number;
        question_text: string;
        quesiion_number: number;
        set_number: number;
        question_type: string;
    } {
        return {
            question_id: this.parseId(this.sanitize(body.question_id)),
            question_text: this.sanitize(body.building_name),
            quesiion_number: this.parseId(this.sanitize(body.quesiion_number)),
            set_number: this.parseId(this.sanitize(body.set_number)),
            question_type: this.sanitize(body.question_type),
        };
    }
}
