// import { Request, Response } from "express";
// import { ActivityService } from "../../services/Student/activity.service";
// import { UserActivity } from "../../entity/UserActivity";
// import { Activity } from "../../entity/Activity";
// import { getRepository } from "typeorm";
// import logger from "../../utils/logger";

// export class ActivityController {
//   constructor(private activityService: ActivityService) {}

//   async getStudentActivitiesController(
//     req: Request,
//     res: Response
//   ): Promise<void> {
//     try {
//       const userId = Number(req.params.id);

//       console.log("typeof userId in Controller: ", typeof userId);

//       const activities = await this.activityService.getStudentActivitiesService(
//         userId
//       );
//       res.status(200).json(activities);
//     } catch (error) {
//       logger.error("❌ Error in getStudentActivitiesController(Student)", {
//         error,
//       });
//       res.status(500).json({ error: "Internal Server Error" });
//     }
//   }

//   async getActivityByIdController(req: Request, res: Response): Promise<void> {
//     try {
//       const userId = Number(req.query.userId);

//       console.log("userId in getActivityByIdController: ", userId);

//       const activity = await this.activityService.getActivityByIdService(
//         req.params.id,
//         userId
//       );
//       if (!activity) {
//         res.status(404).json({ error: "Activity not found" });
//         return;
//       }
//       console.log("🔍 Activity Response:", JSON.stringify(activity, null, 2));
//       res.status(200).json(activity);
//     } catch (error) {
//       logger.error("❌ Error in getActivityByIdController(Admin)", { error });
//       res.status(500).json({ error: "Internal Server Error" });
//     }
//   }

//   async studentEnrollActivityController(
//     req: Request,
//     res: Response
//   ): Promise<void> {
//     try {
//       const userId = parseInt(req.params.id, 10);
//       const activityId = parseInt(req.body.activityId, 10);
//       const food = req.body.food;

//       if (isNaN(userId) || isNaN(activityId)) {
//         throw new Error("Invalid user ID or activity ID.");
//       }

//       const activity = await this.activityService.studentEnrollActivityService(
//         userId,
//         activityId,
//         food
//       );

//       console.log("User successfully registered for the activity.");
//       res
//         .status(200)
//         .json({ message: "Registration successful", activity: activity });
//     } catch (error) {
//       console.error("Error registering user for activity:", error);
//       res.status(500).json({ error: "Failed to register user for activity." });
//     }
//   }

//   async getEnrolledActivitiesController(
//     req: Request,
//     res: Response
//   ): Promise<Response> {
//     const userId = parseInt(req.params.id, 10);
//     if (!userId) {
//       return res.status(400).json({ error: "Invalid user ID." });
//     }
//     try {
//       const result = await this.activityService.getEnrolledActivitiesService(
//         userId
//       );

//       console.log("✅ Data to be sent:", JSON.stringify(result, null, 2));

//       return res
//         .status(200)
//         .header("Cache-Control", "no-store") // ✅ ปิด Cache
//         .json(result);
//     } catch (error) {
//       console.error(`❌ Error in fetchEnrolledActivities: ${error}`);
//       return res.status(500).json({ error: "Internal Server Error" });
//     }
//   }

//   async searchActivityController(req: Request, res: Response): Promise<void> {
//     try {
//       const { ac_name } = req.query;
//       if (!ac_name) {
//         res.status(400).json({ error: "Missing 'ac_name' parameter" });
//         return;
//       }

//       const activities = await this.activityService.searchActivityService(
//         ac_name as string
//       );
//       if (activities.length === 0) {
//         res.status(404).json({ message: "No activities found" });
//         return;
//       }

//       res.status(200).json(activities);
//     } catch (error) {
//       logger.error("❌ Error in searchActivityController(Student)", { error });
//       res.status(500).json({ error: "Internal Server Error" });
//     }
//   }

//   async unEnrollActivityController(req: Request, res: Response): Promise<void> {
//     try {
//       const userId = parseInt(req.params.id, 10);
//       const activityId = parseInt(req.body.activityId, 10);

//       console.log(userId);

//       if (isNaN(userId) || isNaN(activityId)) {
//         res.status(400).json({ error: "Invalid userId or activityId" });
//         return;
//       }

//       const success = await this.activityService.unEnrollActivityService(
//         userId,
//         activityId
//       );
//       if (success) {
//         res
//           .status(200)
//           .json({ message: "Successfully unenrolled from activity" });
//       } else {
//         res.status(404).json({ error: "Activity registration not found" });
//       }
//     } catch (error) {
//       console.error("❌ Error in unEnrollActivityController:", error);
//       res.status(500).json({ error: "Internal Server Error" });
//     }
//   }
// }

// const activityService = new ActivityService();
// export const activityController = new ActivityController(activityService);

// src/controllers/Student/activity.controller.ts
import { Request, Response } from "express";
import { ActivityService } from "../../services/Student/activity.service";
import { ErrorHandledController } from "../error.handled.controller";
import logger from "../../utils/logger";

export class ActivityController extends ErrorHandledController {
  constructor(private readonly activityService: ActivityService) {
    super();
  }

  public async getStudentActivities(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const userId = this.parseId(req.params.id);
      const result = await this.activityService.getStudentActivitiesService(
        userId
      );

      console.log(
        `📊 Returning ${result.length} activities for student ${userId}`
      );
      res.status(200).json(result);
    } catch (error) {
      this.handleError(
        "StudentActivityController.getStudentActivities",
        error,
        res
      );
    }
  }

  public async getActivityById(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.parseOptionalInt(req.query.userId);
      const id = this.parseId(req.params.id);

      const activity = await this.activityService.getActivityByIdService(
        id,
        userId
      );
      if (!activity) {
        res.status(404).json({ error: "Activity not found" });
        return;
      }

      res.status(200).json(activity);
    } catch (error) {
      this.handleError("StudentActivityController.getActivityById", error, res);
    }
  }

  // public async enrollActivity(req: Request, res: Response): Promise<void> {
  //   try {
  //     const userId = this.parseId(req.params.id);
  //     const activityId = this.parseId(req.body.activityId);
  //     const food = this.parseFoodInput(req.body.food);

  //     const result = await this.activityService.studentEnrollActivityService(
  //       userId,
  //       activityId,
  //       food
  //     );

  //     res
  //       .status(200)
  //       .json({ message: "Registration successful", activity: result });
  //   } catch (error) {
  //     this.handleError("StudentActivityController.enrollActivity", error, res);
  //   }
  // }

  public async enrollActivity(req: Request, res: Response): Promise<void> {
    try {
      const activityId = this.parseId(req.params.activityId);
      const studentId = this.parseId(req.params.studentId);
      const food = this.parseFoodInput(req.body.food);

      const result = await this.activityService.studentEnrollActivityService(
        studentId,
        activityId,
        food
      );

      res
        .status(200)
        .json({ message: "Registration successful", activity: result });
    } catch (error) {
      this.handleError("StudentActivityController.enrollActivity", error, res);
    }
  }

  public async getEnrolledActivities(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const userId = this.parseId(req.params.id);
      const result = await this.activityService.getEnrolledActivitiesService(
        userId
      );
      res.status(200).header("Cache-Control", "no-store").json(result);
    } catch (error) {
      this.handleError(
        "StudentActivityController.getEnrolledActivities",
        error,
        res
      );
    }
  }

  public async searchActivity(req: Request, res: Response): Promise<void> {
    try {
      const { ac_name } = req.query;
      if (!ac_name || typeof ac_name !== "string") {
        res
          .status(400)
          .json({ error: "Missing or invalid 'ac_name' parameter" });
        return;
      }

      const result = await this.activityService.searchActivityService(ac_name);
      if (result.length === 0) {
        res.status(404).json({ message: "No activities found" });
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      this.handleError("StudentActivityController.searchActivity", error, res);
    }
  }

  public async unEnrollActivity(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.parseId(req.params.id);
      const activityId = this.parseId(req.body.activityId);

      const success = await this.activityService.unEnrollActivityService(
        userId,
        activityId
      );
      if (success) {
        res
          .status(200)
          .json({ message: "Successfully unenrolled from activity" });
      } else {
        res.status(404).json({ error: "Activity registration not found" });
      }
    } catch (error) {
      this.handleError(
        "StudentActivityController.unEnrollActivity",
        error,
        res
      );
    }
  }

  // 🔧 Utility Parsing Methods
  private parseId(value: any): number {
    const id = parseInt(value, 10);
    if (isNaN(id)) throw new Error("Invalid ID format");
    return id;
  }

  private parseOptionalInt(value: any): number | null {
    return !isNaN(Number(value)) ? parseInt(value, 10) : null;
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
  getStudentActivities: controller.getStudentActivities.bind(controller),
  getActivityById: controller.getActivityById.bind(controller),
  enrollActivity: controller.enrollActivity.bind(controller),
  getEnrolledActivities: controller.getEnrolledActivities.bind(controller),
  searchActivity: controller.searchActivity.bind(controller),
  unEnrollActivity: controller.unEnrollActivity.bind(controller),
};
