// src/controllers/eventcoop.controller.ts
import { Request, Response } from "express";
import { EventCoopService } from "../../services/Student/eventcoop.service";
import { ErrorHandledController } from "../error.handled.controller";

export class EventCoopController extends ErrorHandledController {
  constructor(private readonly eventCoopService = new EventCoopService()) {
    super();
  }

  public async getAll(req: Request, res: Response): Promise<void> {
    try {
      const data = await this.eventCoopService.getEventCoop();
      res.status(200).json(data);
    } catch (error) {
      this.handleError("EventCoopController.getAll", error, res);
    }
  }

  public async count(req: Request, res: Response): Promise<void> {
    try {
      const count = await this.eventCoopService.countEventCoop();
      res.status(200).json({ count });
    } catch (error) {
      this.handleError("EventCoopController.count", error, res);
    }
  }
}

const eventCoopService = new EventCoopService();
const controller = new EventCoopController(eventCoopService);

export const eventCoopController = {
  getAll: controller.getAll.bind(controller),
  count: controller.count.bind(controller),
};
