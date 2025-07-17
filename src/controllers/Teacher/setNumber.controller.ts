import { Request, Response } from "express";
import { SetNumberService } from "../../services/Teacher/setNumber.service";
import { ErrorHandledController } from "../error.handled.controller";
import xss from "xss";

export class SetNumberController extends ErrorHandledController {
  constructor(private readonly setNumberService: SetNumberService) {
    super();
  }

  public async create(req: Request, res: Response): Promise<void> {
    try {
      const data = this.parseSetNumberPayload(req.body);

      const created = await this.setNumberService.createSetNumber(
        data.name,
        data.status
      );

      if (created) {
        res.status(201).json({
          message: "สร้างชุดคำถามสำเร็จ!",
          setNumber: created,
        });
      } else {
        res.status(409).json({ message: "มีชุดคำถามนี้อยู่ในระบบแล้ว!" });
      }
    } catch (error) {
      this.handleError("SetNumberController.create", error, res);
    }
  }

  // ✅ แยก logic sanitize และ validate
  private parseSetNumberPayload(body: any): {
    name: string;
    status: "Active" | "Inactive";
  } {
    const name = xss(body.name);
    const status = xss(body.status);

    const allowedStatuses = ["Active", "Inactive"];
    if (!allowedStatuses.includes(status)) {
      throw new Error(`❌ Invalid status value: ${status}`);
    }

    return {
      name,
      status: status as "Active" | "Inactive",
    };
  }
}
