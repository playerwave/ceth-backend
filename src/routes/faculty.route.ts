import { Router, Request, Response, NextFunction } from "express";
import { FacultyController } from "../controllers/faculty.controller";
import { Users } from "../entity/Users";
import { UsersController } from "../controllers/users.controller";

const router = Router();
const facultyController = new FacultyController();
const usersController = new UsersController();

async function Admin(req: Request, res: Response, next: NextFunction): Promise<any> {
    const users = req.user as Users
    if (!users || !users.roles_id) {
        return res.status(401).json({
            user: null,
            notification: `Unauthorized access. Please log in.`
        })
    }

    const rolesAdmin = await usersController.rolesAdmin(req, res);

    if (!rolesAdmin) {
        return res.status(401).json({
            user: null,
            notification: `Error fetching role information.`
        });
    }

    const RolesUsers = users.roles_id
    const Roles = parseInt(rolesAdmin[0].roles_id, 10);
    console.log("Roles: ", Roles)
    console.log("Type of Roles: ", typeof Roles);

    if (RolesUsers === Roles) {
        return next()
    } else {
        return req.logOut((err) => {
            if (err) return next(err);
            console.log(req.user)
        });
    }

}

router.get("/data", Admin, async (req: Request, res: Response) => {
    const users = req.user as Users
    const getFaculty = await facultyController.getFaculty(req, res)
    if (req.isAuthenticated()) {
        res.status(200).json({
            page: "Faculty Page",
            user: users,
            facultyData: getFaculty,
            notification: "The data connection was successful."
        })
    } else {
        res.status(401).json({
            page: "Faculty Page",
            user: null,
            notification: `Error fetching Faculty data`
        })
    }
})

router.post("/addNameFaculty", Admin, async (req: Request, res: Response) => {
    return facultyController.addFaculty(req, res);
});

router.put("/editNameFaculty/:faculty_id", Admin, async (req: Request, res: Response) => {
    return facultyController.updateFacultyByName(req, res);
});

router.delete("/deleteFaculty/:faculty_id", Admin, async (req: Request, res: Response) => {
    return facultyController.deleteFaculty(req, res)
});

export default router