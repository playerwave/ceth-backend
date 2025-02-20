import { Request, Response } from "express";
import { UserService } from "../../services/Test/user.service";

export class UserController {
  private userService = new UserService();

  createUser = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { firstName, lastName, age } = req.body;
      if (!firstName || !lastName || age === undefined) {
        return res.status(400).json({ message: "Invalid input data" });
      }
      const user = await this.userService.createUser(firstName, lastName, age);
      return res.status(201).json(user);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  getAllUsers = async (req: Request, res: Response): Promise<Response> => {
    try {
      const users = await this.userService.getAllUsers();
      return res.status(200).json(users);
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  getUserById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const user = await this.userService.getUserById(id);
      return user
        ? res.status(200).json(user)
        : res.status(404).json({ message: "User not found" });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  updateUser = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = parseInt(req.params.id, 10);
      const { firstName, lastName, age } = req.body;
      if (isNaN(id) || !firstName || !lastName || age === undefined) {
        return res.status(400).json({ message: "Invalid input data" });
      }
      const updatedUser = await this.userService.updateUser(
        id,
        firstName,
        lastName,
        age
      );
      return updatedUser
        ? res.status(200).json(updatedUser)
        : res.status(404).json({ message: "User not found" });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  patchUser = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = parseInt(req.params.id, 10);
      const userData = req.body; // รับข้อมูลที่เป็น partial user
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      const updatedUser = await this.userService.patchUser(id, userData);
      return updatedUser
        ? res.status(200).json(updatedUser)
        : res.status(404).json({ message: "User not found" });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  deleteUser = async (req: Request, res: Response): Promise<Response> => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      await this.userService.deleteUser(id);
      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  };
}
