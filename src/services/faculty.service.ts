import { FacultyDao } from "../daos/faculty.dao";
import { Faculty } from "../entity/Faculty";

export class FacultyService {
    private facultyDao = new FacultyDao()

    async getFaculty(): Promise<Faculty[]> {
        return await this.facultyDao.getFaculty();
    }

    async addFaculty(faculty_name: string): Promise<boolean> {
        try {
            const find_FacultyName = await this.facultyDao.getFacultyByName(faculty_name);
            if (find_FacultyName.length > 0) {
                console.log('มีชื่อคณะนี้อยูในระบบแล้ว');
                return false;
            } else {
                await this.facultyDao.addFaculty(faculty_name)
                return true
            }
        } catch (error) {
            throw new Error(`Error form Faculty Service Function -> addFaculty : ${error}`);
        }
    }

    async updateFacultyByName(faculty_id: number, faculty_name: string): Promise<boolean> {
        try {
            const find_FacultyName = await this.facultyDao.getFacultyByName(faculty_name);
            if (find_FacultyName.length > 0) {
                console.log('มีชื่อคณะนี้อยูในระบบแล้ว');
                return false;
            } else {
                await this.facultyDao.updateFacultyByName(faculty_id, faculty_name)
                return true
            }
        } catch (error) {
            throw new Error(`Error form Faculty Service Function -> updateFacultyByName : ${error}`);
        }
    }

    async deleteFaculty(faculty_id: number): Promise<boolean> {
        try {
            const result = await this.facultyDao.deleteFaculty(faculty_id);

            if (result && result.length > 0) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            throw new Error(`Error from Faculty Service Function -> deleteFaculty : ${error}`);
        }
    }

}