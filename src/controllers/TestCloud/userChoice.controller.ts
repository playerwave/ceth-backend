import { Request, Response } from "express";
import { UserChoiceService } from "../../services/TestCloud/userChoice.service";

export class UserChoiceController {
  private userChoiceService = new UserChoiceService();

  // ฟังก์ชันสำหรับแสดงรายชื่อผู้ใช้
  getUserChoice = async (req: Request, res: Response) => {
    try {
      const userChoices = await this.userChoiceService.getUserChoice();
      return res.render("userChoice.ejs", {
        userChoice: userChoices,
      });
    } catch (error) {
      res.status(500).send("Error to Response");
    }
  };
}
