import { Request, Response } from "express";
import { ActivityService } from "../../services/Test/activity.server";

export class ActivityController {
  private activityService = new ActivityService();

  getAllActivitys = async (req: Request, res: Response): Promise<Response> => {
    try {
      const activitys = await this.activityService.getAllActivitys();
      return res.status(200).json(activitys);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  getActivityById = async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    try {
      const activity = await this.activityService.getActivitiesById(Number(id));
      if (activity) {
        return res.status(200).json(activity);
      } else {
        return res.status(404).json({ message: "Activity not found" });
      }
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  searchActivitiesByName = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { searchName } = req.query; // เปลี่ยนจาก searchTerm เป็น searchName
    console.log("Received searchName:", searchName); // ตรวจสอบคำค้นหาที่ได้รับจาก Postman

    if (!searchName) {
      return res.status(400).json({ message: "Search name is required" });
    }

    try {
      const activities = await this.activityService.searchActivitiesByName(
        String(searchName) // ใช้ searchName แทน searchTerm
      );
      console.log("Activities found:"); // ตรวจสอบผลลัพธ์ที่ได้จากการค้นหา
      if (activities.length > 0) {
        return res.status(200).json(activities);
      } else {
        return res.status(404).json({ message: "Activity not found" });
      }
    } catch (error) {
      console.error("Error during search:", error); // เพิ่มการตรวจสอบข้อผิดพลาด
      return res.status(500).json({ message: "Internal server error" });
    }
  };
}
