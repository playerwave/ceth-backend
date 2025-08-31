import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import { TeacherStudentService } from "../../services/Teacher/teacherStudent.service";

const upload = multer({ dest: path.join(__dirname, "../../../uploads/") });
const studentService = new TeacherStudentService();

export class TeacherStudentController {
  public uploadMiddleware = upload.single("File");

  // ================= Upload Students =================
  public async uploadStudents(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: "File is required" });
        return;
      }

      const result = await studentService.uploadStudents(req.file.path);
      res.json(result);
    } catch (error) {
      console.error("❌ Controller error:", error);
      res.status(500).json({ error: "Failed to upload students" });
    }
  }

  // ================= Get All Users =================
  public async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await studentService.getAllUsers();
      res.json({ count: users.length, users });
    } catch (error) {
      console.error("❌ Controller error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  }
}
