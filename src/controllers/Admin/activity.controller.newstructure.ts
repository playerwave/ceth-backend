// src/controllers/Admin/activity.controller.ts
import { Request, Response } from "express";
import { ActivityService } from "../../services/Admin/activity.service.newstructure";
import { ErrorHandledController } from "../error.handled.controller";

export class ActivityController extends ErrorHandledController {
  constructor(private readonly activityService: ActivityService) {
    super();
  }

  public async create(req: Request, res: Response): Promise<void> {
    try {
      const data = this.parseActivityPayload(req.body);
      const result = await this.activityService.createActivityService(data);
      res.status(201).json(result);
    } catch (error) {
      this.handleError("ActivityController.create", error, res);
    }
  }

  public async update(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.id);
      const updated = await this.activityService.updateActivityService(
        id,
        req.body
      );
      if (!updated) res.status(404).json({ error: "Activity not found" });
      res.status(200).json(updated);
    } catch (error) {
      this.handleError("ActivityController.update", error, res);
    }
  }

  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.id);
      const deleted = await this.activityService.deleteActivityService(id);
      if (!deleted) res.status(404).json({ error: "Activity not found" });
      res.status(200).json({ message: "Activity deleted successfully" });
    } catch (error) {
      this.handleError("ActivityController.delete", error, res);
    }
  }

  public async getAll(req: Request, res: Response): Promise<void> {
    try {
      const activities = await this.activityService.getAllActivitiesService();
      res.status(200).json(activities);
    } catch (error) {
      this.handleError("ActivityController.getAll", error, res);
    }
  }

  public async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.id);
      const activity = await this.activityService.getActivityByIdService(id);
      if (!activity) res.status(404).json({ error: "Activity not found" });
      res.status(200).json(activity);
    } catch (error) {
      this.handleError("ActivityController.getById", error, res);
    }
  }

  public async search(req: Request, res: Response): Promise<void> {
    try {
      const { ac_name } = req.query;
      if (!ac_name)
        res.status(400).json({ error: "Missing 'ac_name' parameter" });
      const results = await this.activityService.searchActivityService(
        ac_name as string
      );
      if (!results.length)
        res.status(404).json({ message: "No activities found" });
      res.status(200).json(results);
    } catch (error) {
      this.handleError("ActivityController.search", error, res);
    }
  }

  public async getEnrolledStudents(req: Request, res: Response): Promise<void> {
    try {
      const id = this.parseId(req.params.id);
      const students =
        await this.activityService.getEnrolledStudentsListService(id);
      res.status(200).json({ activityId: id, students });
    } catch (error) {
      this.handleError("ActivityController.getEnrolledStudents", error, res);
    }
  }

  // ⛱️ Utility methods (Encapsulation)
  private parseId(value: string): number {
    const id = parseInt(value, 10);
    if (isNaN(id)) throw new Error("Invalid ID format");
    return id;
  }

  private parseActivityPayload(body: any): any {
    return {
      ...body,
      ac_image_url: body.ac_image_url || "",
      assessment_id: this.parseOptionalInt(body.assessment_id),
      ac_seat: this.parseOptionalInt(body.ac_seat),
      ac_registered_count: this.parseOptionalInt(body.ac_registered_count, 0),
      ac_attended_count: this.parseOptionalInt(body.ac_attended_count, 0),
      ac_not_attended_count: this.parseOptionalInt(
        body.ac_not_attended_count,
        0
      ),
      ac_type: body.ac_type || "Soft Skill",
      ac_start_register: body.ac_start_register || null,
      ac_end_register: body.ac_end_register || null,
      ac_start_time: body.ac_start_time || null,
      ac_end_time: body.ac_end_time || null,
      ac_normal_register: body.ac_normal_register || null,
      ac_start_assessment: body.ac_start_assessment || null,
      ac_end_assessment: body.ac_end_assessment || null,
      assessment: body.assessment || null,
      ac_food: this.parseFoodInput(body.ac_food),
    };
  }

  private parseOptionalInt(
    value: any,
    fallback: number | null = null
  ): number | null {
    return !isNaN(Number(value)) ? parseInt(value, 10) : fallback;
  }

  private parseFoodInput(input: any): string[] {
    if (!input) return [];
    if (Array.isArray(input)) return input;
    if (typeof input === "string") {
      try {
        return JSON.parse(input);
      } catch {
        return [input];
      }
    }
    return [];
  }
}

const activityService = new ActivityService();
const controller = new ActivityController(activityService);

export const activityController = {
  create: controller.create.bind(controller),
  update: controller.update.bind(controller),
  delete: controller.delete.bind(controller),
  getAll: controller.getAll.bind(controller),
  getById: controller.getById.bind(controller),
  search: controller.search.bind(controller),
  getEnrolledStudents: controller.getEnrolledStudents.bind(controller),
};
