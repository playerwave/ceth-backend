import { Request, Response } from "express";
import { ActivityFoodService } from "../services/activity_food.service";

export class ActivityFoodController {
    private service = new ActivityFoodService();

    async getAll(req: Request, res: Response) {
        try {
            const data = await this.service.getAllActivityFoods();
            res.json(data);
        } catch {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const data = await this.service.getActivityFoodById(id);
            if (!data) return res.status(404).json({ error: "Not found" });
            res.json(data);
        } catch {
            res.status(400).json({ error: "Invalid ID" });
        }
    }
}
