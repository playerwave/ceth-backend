import { Request, Response } from "express";
import { EventCoopService } from "../../services/TestCloud/eventCoop.service";

export class EventCoopController {
  private eventCoopService = new EventCoopService();

  // ฟังก์ชันสำหรับแสดงรายชื่อผู้ใช้
  getEventCoop = async (req: Request, res: Response) => {
    try {
      const events = await this.eventCoopService.getEventCoop();
      return res.render("event.ejs", {
        event: events,
      });
    } catch (error) {
      res.status(500).send("Error to Response");
    }
  };
}
