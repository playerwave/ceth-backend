import { ActivityService } from "../../services/Test/activity.service";
import { Request, Response } from "express";

export class ActivityController {
    private activityService = new ActivityService;

    getActivities = async (req: Request, res: Response) => {
        try {
            const result = await this.activityService.getActivities();
            return res.status(200).json(result)
        } catch (error) {
            console.log(`Error From activity Service: ${error}`)
            res.status(500).send("Error to Resposne")
        }
    }

    searchActivity = async (req: Request, res: Response) => {
        const { ac_name } = req.query
        if (!ac_name) {
            return res.status(400).send("You sent an invalid request.")
        }
        try {
            const activityName = await this.activityService.searchActivity(String(ac_name));
            if (activityName.length > 0) {
                return res.status(200).json(activityName)
            } else {
                return res.status(404).send("No activities found.")
            }
        } catch (error) {
            console.log(`Error From activity Service: ${error}`)
            res.status(500).send(`Error: ${error}`)
        }
    }
}

