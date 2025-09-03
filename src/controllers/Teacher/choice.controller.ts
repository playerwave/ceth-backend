import { Request, Response } from "express";
import { BuildingService } from "../../services/Teacher/building.service";
import { ErrorHandledController } from "../error.handled.controller";
import xss from "xss";
import { ChoiceService } from "../../services/Teacher/choice.service";

export class ChoiceController extends ErrorHandledController {
    constructor(private readonly choiceService: ChoiceService) {
        super();
    }

    public async count(req: Request, res: Response): Promise<void> {
        try {
            const result = await this.choiceService.countChoice();
            res.status(200).json(result);
        } catch (error) {
            this.handleError("ChoiceController.count", error, res);
        }
    }

    public async getAll(req: Request, res: Response): Promise<void> {
        try {

            const choice = await this.choiceService.getChoice()
            res.status(200).json(choice); // ✅ ส่ง array ล้วน
        } catch (error) {
            this.handleError("ChoiceController.getAll", error, res);
        }
    }

    public async getChoiceByQuestionID(req: Request, res: Response): Promise<void> {
        const { question_id } = req.params;
        const id = Number(question_id);
        try {
            const choice = await this.choiceService.getChoiceByQuestionID(id)
            if (choice.length > 0) {
                res.status(200).json(choice);
            } else {
                res.status(404).json({
                    message: "Not found Data"
                })
            }
        } catch (error) {
            this.handleError("ChoiceController.getChoiceByQuestionID", error, res);
        }
    }

    public async create(req: Request, res: Response): Promise<void> {
        try {
            const data = this.parseChoicePayload(req.body);
            const created = await this.choiceService.addChoice(
                data.choice_text,
                data.question_id
            );
            if (created !== null) {
                res.status(201).json({ message: "เพิ่มคำตอบสำเร็จ!", choice: created });
            } else {
                res.status(404).json({ message: "เพิ่มคำตอบไม่สำเร็จ!" });
            }
        } catch (err: any) {
            // แยก 400 จาก 500
            if (
                /ห้ามว่าง|ไม่ถูกต้อง/i.test(err?.message ?? "")
            ) {
                res.status(400).json({ error: err.message });
                return;
            }
            this.handleError("ChoiceController.create", err, res);
        }
    }


    public async update(req: Request, res: Response): Promise<void> {
        try {
            const choice_id = this.parseId(req.params.choice_id);
            const data = this.parseChoicePayloadUpdate(req.body);

            const updated = await this.choiceService.updateChoice(choice_id, data.choice_text)
            if (updated.length > 0) {
                res.status(200).json({
                    message: "แก้ไขคำตอบสำเร็จ!",
                    updated,
                });
            } else {
                res.status(404).json({
                    message: "แก้ไขคำตอบ ไม่สำเร็จ !",
                });
            }
        } catch (error) {
            this.handleError("ChoiceController.update", error, res);
        }
    }

    public async delete(req: Request, res: Response): Promise<void> {
        try {
            const choice_id = this.parseId(req.params.choice_id);

            const deleted = await this.choiceService.deleteChoice(choice_id)

            if (deleted.length > 0) {
                res.status(200).json({
                    message: "ลบคำตอบสำเร็จ !",
                });
            } else {
                res.status(404).json({
                    message: "ไม่พบข้อมูลของคำตอบที่ต้องการลบ !",
                });
            }
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

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

    private parseChoicePayloadUpdate(body: any): {
        choice_text: string;
    } {
        return {
            choice_text: this.sanitize(body.choice_text),
        };
    }

    private parseChoicePayload(body: any): {
        choice_text: string
        question_id: number;
    } {
        return {
            choice_text: this.sanitize(body.choice_text),
            question_id: this.parseId(this.sanitize(body.question_id)),
        };
    }

}
