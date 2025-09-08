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

    public async create(req: Request, res: Response): Promise<void> {
        try {
            const data = this.parseQuestionPayload(req.body);
            const created = await this.questionService.addQuestion(
                data.question_text,
                data.set_number_id,
                data.question_type
            );
            res.status(201).json({ message: "เพิ่มคำถามสำเร็จ!", question: created });
        } catch (err: any) {
            // แยก 400 จาก 500
            if (
                /ห้ามว่าง|ไม่ถูกต้อง/i.test(err?.message ?? "")
            ) {
                res.status(400).json({ error: err.message });
                return;
            }
            this.handleError("QuestionController.create", err, res);
        }
    }

    //สำหรับduplicate
    // QuestionController.ts
    public async createWithChoices(req: Request, res: Response): Promise<void> {
        try {
            const data = this.parseQuestionPayload(req.body);

            // 1) สร้าง question
            const createdQ = await this.questionService.addQuestion(
                data.question_text,
                data.set_number_id,
                data.question_type
            );

            if (!createdQ) {
                res.status(400).json({ message: "ไม่สามารถสร้างคำถามได้" });
                return;
            }

            // 2) loop insert choices
            const options = req.body.options || [];  // ✅ แก้ตรงนี้
            const createdChoices = [];
            for (const o of options) {
                const newChoice = await this.questionService.addChoice(
                    createdQ.question_id,
                    o.choice_text
                );
                createdChoices.push(newChoice);
            }

            res.status(201).json({
                message: "เพิ่มคำถามพร้อมตัวเลือกสำเร็จ!",
                question: createdQ,
                choices: createdChoices,
            });
        } catch (err: any) {
            this.handleError("QuestionController.createWithChoices", err, res);
        }
    }




    public async getQuestionBySetNumberID(req: Request, res: Response): Promise<void> {
        const { set_number_id } = req.params
        const SetNumberID = parseInt(set_number_id)
        try {
            const result = await this.questionService.getQuestionBySetNumberID(SetNumberID)
            if (result) {
                res.status(200).json({
                    data: result,
                    message: "ดึงข้อมูลสำเร็จ"
                })
            } else {
                res.status(404).json({ message: "ไม่พบข้อมูลในระบบ" })
            }
        } catch (error) {
            this.handleError("QuestionController.getAll", error, res);
        }
    }


    public async update(req: Request, res: Response): Promise<void> {
        try {
            const { question_id } = req.params
            const QuestionID = parseInt(question_id)
            console.log(question_id)
            const data = this.parseQuestionPayloadUpdate(req.body);

            const updated = await this.questionService.updateQuestion(QuestionID, data.question_text, data.question_type)
            if (updated.length > 0) {
                res.status(200).json({
                    message: "แก้ไขคำถามสำเร็จ!",
                    updated,
                });
            } else {
                res.status(404).json({
                    message: "แก้ไขคำถาม ไม่สำเร็จ !",
                });
            }
        } catch (error) {
            this.handleError("QuestionController.update", error, res);
        }
    }

    public async delete(req: Request, res: Response): Promise<void> {
        try {
            const question_id = this.parseId(req.params.question_id);

            const deleted = await this.questionService.deleteQuestion(question_id)

            if (deleted.length > 0) {
                res.status(200).json({
                    message: "ลบคำถามสำเร็จ !",
                });
            } else {
                res.status(404).json({
                    message: "ไม่พบข้อมูลของคำถามที่ต้องการลบ !",
                });
            }
        } catch (error) {
            if (
                this.isErrorWithMessage(error) &&
                error.message.includes("มีห้องที่ผูกอยู่")
            ) {
                res.status(400).json({ message: error.message });
            } else {
                this.handleError("QuestionController.delete", error, res);
            }
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

    private parseQuestionPayloadUpdate(body: any): {
        question_text: string;
        question_type: string;
    } {
        return {
            question_text: this.sanitize(body.question_text),
            question_type: this.sanitize(body.question_type)
        };
    }

    private parseQuestionPayload(body: any) {
        // รองรับทั้ง root และภายใต้ data
        const question_text =
            (body?.question_text ?? body?.data?.question_text ?? "").toString().trim();

        const set_number_id_raw = body?.set_number_id ?? body?.data?.set_number_id;
        const set_number_id = Number.parseInt(set_number_id_raw, 10);

        // เผื่อมีคนส่ง key แบบ "data.question_type"
        const dotKey = body["data.question_type"];
        const question_type =
            (body?.question_type ?? body?.data?.question_type ?? dotKey ?? "")
                .toString()
                .trim();

        if (!question_text) throw new Error("question_text ห้ามว่าง");
        if (!Number.isInteger(set_number_id) || set_number_id <= 0)
            throw new Error("set_number_id ไม่ถูกต้อง");
        const allowed = [
            // ค่าที่อยู่ใน enum จริงในตาราง
            "Fix Single answer",
            "Single answer",
            "Multiple answer",
            "Text answer",
        ];
        if (!allowed.includes(question_type)) {
            throw new Error("question_type ไม่ถูกต้อง");
        }

        return { question_text, set_number_id, question_type };
    }

}
