import { FacultyDao } from "../daos/faculty.dao";
import { Faculty } from "../entity/Faculty";
import redis from "../config/redis";
import { json } from "stream/consumers";


export class FacultyService {
    private facultyDao = new FacultyDao()

    async getFaculty(): Promise<Faculty[]> {
        const cacheKey = "faculty:all";

        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            console.log("Returning cached faculty data");
            return JSON.parse(cachedData)
        }

        const facultyData = await this.facultyDao.getFaculty();
        await redis.set(cacheKey, JSON.stringify(facultyData), "EX", 60)
        return facultyData
    }

    async addFaculty(faculty_name: string): Promise<boolean> {
        try {
            const find_FacultyName = await this.facultyDao.getFacultyByName(faculty_name);
            if (find_FacultyName.length > 0) {
                console.log('มีชื่อคณะนี้อยูในระบบแล้ว');
                return false;
            } else {
                await this.facultyDao.addFaculty(faculty_name)
                await redis.del("faculty:all");
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
                await redis.del("faculty:all");
                return true
            }
        } catch (error) {
            throw new Error(`Error form Faculty Service Function -> updateFacultyByName : ${error}`);
        }
    }

    async deleteFaculty(faculty_id: number): Promise<boolean> {
        try {
            const result = await this.facultyDao.deleteFaculty(faculty_id);
            await redis.del("faculty:all");
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