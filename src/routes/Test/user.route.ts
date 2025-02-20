import { Router, Request, Response } from "express";
import { UserController } from "../../controllers/Test/user.controller";

const userController = new UserController();
const router = Router();

router.post("/create-user", async (req: Request, res: Response) => {
  await userController.createUser(req, res);
});

router.get("/users", async (req: Request, res: Response) => {
  await userController.getAllUsers(req, res);
});

router.get("/user/:id", async (req: Request, res: Response) => {
  await userController.getUserById(req, res);
});

router.put("/update-user/:id", async (req: Request, res: Response) => {
  await userController.updateUser(req, res);
});

router.patch("/patch-user/:id", async (req: Request, res: Response) => {
  await userController.patchUser(req, res);
});

router.delete("/delete-user/:id", async (req: Request, res: Response) => {
  await userController.deleteUser(req, res);
});

export default router;
