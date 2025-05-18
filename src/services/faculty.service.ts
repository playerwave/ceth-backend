import { FacultyDao } from "../daos/Admin/faculty.dao";
import { Faculty } from "../interfaces/Faculty";

export class FacultyService {
  private facultyDao = new FacultyDao();

  async getAllFaculties(): Promise<Faculty[]> {
    return this.facultyDao.getAllFaculties();
  }

  async getFacultyById(id: number): Promise<Faculty | null> {
    return this.facultyDao.getFacultyById(id);
  }
}
