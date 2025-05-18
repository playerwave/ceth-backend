import { Repository } from "typeorm";
import { connectDatabase } from "../database/database";
import { Faculty } from "../entity/Faculty";
export class FacultyDao {
    private facultyRepository: Repository<Faculty> | null = null;

    constructor() {
        connectDatabase().then((connection) => {
            this.facultyRepository = connection.getRepository(Faculty);
        }).catch((error) => {
            console.log("Database connection failed:", error)
        })
    }

    async getFaculty(): Promise<Faculty[]> {
        if (!this.facultyRepository) {
            throw new Error("Repository is not initialized");
        }
        try {
            const sql = `SELECT * FROM faculty`
            const result = await this.facultyRepository.query(sql);
            return result
        } catch (error) {
            throw new Error(`Error from Faculty Dao Function -> getFaculty : ${error}`);
        }
    }

    async getFacultyByName(faculty_name: string): Promise<Faculty[]> {
        if (!this.facultyRepository) {
            throw new Error("Repository is not initialized");
        }
        try {
            const sql = `SELECT faculty_name FROM faculty WHERE faculty_name LIKE $1`
            const result = await this.facultyRepository.query(sql, [`%${faculty_name}%`]);
            return result
        } catch (error) {
            throw new Error(`Error from Faculty Dao Function -> getFacultyByName : ${error}`);
        }
    }

    async addFaculty(faculty_name: string): Promise<Faculty[]> {
        if (!this.facultyRepository) {
            throw new Error("Repository is not initialized");
        }
        try {
            const FacultyName = faculty_name.trim();
            const sql = `INSERT INTO faculty (faculty_name) VALUES ($1)`
            const result = await this.facultyRepository.query(sql, [FacultyName]);
            return result
        } catch (error) {
            throw new Error(`Error from Faculty Dao Function -> addFaculty : ${error}`);
        }
    }

    async updateFacultyByName(faculty_id: number, faculty_name: string): Promise<Faculty[]> {
        if (!this.facultyRepository) {
            throw new Error("Repository is not initialized");
        }
        try {
            const FacultyName = faculty_name.trim();
            const sql = `UPDATE faculty SET faculty_name = $1 WHERE faculty_id = $2`
            const result = await this.facultyRepository.query(sql, [FacultyName, faculty_id])
            return result
        } catch (error) {
            throw new Error(`Error from Faculty Dao Function -> updateFacultyByName : ${error}`);
        }
    }

    async deleteFaculty(faculty_id: number): Promise<Faculty[]> {
        if (!this.facultyRepository) {
            throw new Error("Repository is not initialized");
        }
        try {
            const sql = `DELETE FROM faculty WHERE faculty_id = $1`
            const result = await this.facultyRepository.query(sql, [faculty_id])
            return result
        } catch (error) {
            throw new Error(`Error from Faculty Dao Function -> deleteFaculty : ${error}`);
        }
    }

}