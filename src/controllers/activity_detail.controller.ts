import { Request, Response } from "express";
import { ActivityDetailService } from "../services/activity_detail.service";

export class ActivityDetailController {
  private service = new ActivityDetailService();

  async getAll(req: Request, res: Response) {
    try {
      const data = await this.service.getAllActivityDetails();
      res.json(data);
    } catch {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const data = await this.service.getActivityDetailById(id);
      if (!data) return res.status(404).json({ error: "Not found" });
      res.json(data);
    } catch {
      res.status(400).json({ error: "Invalid ID" });
    }
  }
}
