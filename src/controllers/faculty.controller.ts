import { FacultyService } from "../services/faculty.service";
import { Request, Response } from "express";
import xss from "xss";

export class FacultyController {
    private facultyService = new FacultyService();


    private sanitizeInput(input: any): string {
        return xss(input);
    }

    getFaculty = async (req: Request, res: Response): Promise<any> => {
        try {
            const result = await this.facultyService.getFaculty()
            return result
        } catch (error) {
            res.status(500).json(`Error fetching Faculty data : ${error}`);
        }
    }

    addFaculty = async (req: Request, res: Response): Promise<void> => {
        const { faculty_name } = req.body;
        const facultyNameSanitize = this.sanitizeInput(faculty_name)
        try {
            const addFacultyName = await this.facultyService.addFaculty(facultyNameSanitize)
            if (addFacultyName) {
                res.status(200).json({ message: "เพิ่มชื่อคณะสำเร็จ !" });
            } else {
                res.status(404).json({ message: "มีชื่อคณะนี้อยูในระบบแล้ว !" });
            }
        } catch (error) {
            console.error("Add Faculty Name error:", error);
            res.status(500).json({ message: `เกิดข้อผิดพลาด: ${error}` });
        }
    };

    updateFacultyByName = async (req: Request, res: Response): Promise<void> => {
        const { faculty_id } = req.params
        const { faculty_name } = req.body;
        const facultyIDSanitize = parseInt(this.sanitizeInput(faculty_id))
        const facultyNameSanitize = this.sanitizeInput(faculty_name)
        try {
            const updated = await this.facultyService.updateFacultyByName(facultyIDSanitize, facultyNameSanitize)
            if (updated) {
                res.status(200).json({ message: "แก้ชื่อคณะสำเร็จ !" });
            } else {
                res.status(404).json({ message: "มีชื่อคณะนี้อยูในระบบแล้ว !" });
            }
        } catch (error) {
            console.error("Add Faculty Name error:", error);
            res.status(500).json({ message: `เกิดข้อผิดพลาด: ${error}` });
        }
    };

    deleteFaculty = async (req: Request, res: Response): Promise<void> => {
        const { faculty_id } = req.params

        const facultyIDSanitize = parseInt(this.sanitizeInput(faculty_id))
        try {
            const deleted = await this.facultyService.deleteFaculty(facultyIDSanitize)
            if (deleted) {
                res.status(200).json({ message: "ลบชื่อคณะสำเร็จ !" });
            } else {
                res.status(404).json({ message: "ไม่พบข้อมูลคณะที่ต้องการลบ !" });
            }
        } catch (error) {
            console.error("Add Faculty Name error:", error);
            res.status(500).json({ message: `เกิดข้อผิดพลาด: ${error}` });
        }
    };

}