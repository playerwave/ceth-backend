import { Request, Response } from "express";
import { ChoiceService } from "../../services/TestCloud/choice.service";

export class ChoiceController {
  private choiceService = new ChoiceService();

  // ฟังก์ชันสำหรับแสดงรายชื่อผู้ใช้
  getChoice = async (req: Request, res: Response) => {
    try {
      const choices = await this.choiceService.getChoice();
      return res.render("choice.ejs", {
        choice: choices,
      });
    } catch (error) {
      res.status(500).send("Error to Response");
    }
  };
}
