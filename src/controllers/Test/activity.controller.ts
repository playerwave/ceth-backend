import { Request, Response } from "express";
import { ActivityService } from "../../services/Test/activity.server";
import { json } from "stream/consumers";

export class ActivityController {
  private activityService = new ActivityService();

  getAcitvities = async (req: Request, res: Response) => {
    try {
      const activity = await this.activityService.getAcitvities();
      return res.status(200).json(activity)
    } catch (error) {
      res.status(500).send("Error to Resposne")
    }
  }

  searchActivity = async (req: Request, res: Response) => {
    const { ac_name } = req.query
    console.log(req.query.ac_name);

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
      res.status(500).send(`Error: ${error}`)
    }
  }




  // getTest = async (req: Request, res: Response) => {
  //   try {
  //     const test = await this.activityService.getTests();
  //     return res.status(200).json(test);
  //   } catch (error) {
  //     res.status(500).send("No activities found.")
  //   }
  // }
}
