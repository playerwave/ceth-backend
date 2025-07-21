import { ActivityService } from "../../services/visitor/avtivity.service";
import { ErrorHandledController } from "../error.handled.controller";
import { Request, Response } from "express";

export class ActivityController extends ErrorHandledController {
    constructor(private readonly activityService = new ActivityService()) {
        super();
    }

    private parseOptionalInt(value: any, fallback: number): number {
        return !isNaN(Number(value)) ? parseInt(value, 10) : fallback;
    }

    public async countActivity(req: Request, res: Response): Promise<void> {
        try {
            const result = await this.activityService.countActivity();
            res.status(200).json(result);
        } catch (error) {
            this.handleError("DepartmentController.count", error, res);
        }
    }

    public async getAllActivityByVisitor(req: Request, res: Response): Promise<void> {
        try {
            const page = this.parseOptionalInt(req.query.page, 1);
            const limit = this.parseOptionalInt(req.query.limit, 10);
            const result = await this.activityService.getAllActivityByVisitor(page, limit)
            res.status(200).json(result)
        } catch (error) {
            this.handleError("ActivityController.count", error, res);
        }
    }
}