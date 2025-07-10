import { Request, Response, NextFunction } from "express";
import { UsersController } from "../controllers/users.controller";
import { Users } from "../entity/users.entity";

const usersController = new UsersController();

export async function Admin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const users = req.user as Users;
  if (!users || !users.roles_id) {
    res.status(401).json({
      user: null,
      notification: `Unauthorized access. Please log in.`,
    });
    return; // ✅ return void แทนการ return response
  }

  const isAdmin = await usersController.rolesAdmin();

  if (!isAdmin || isAdmin.length === 0) {
    res.status(403).json({
      user: null,
      notification: `Access denied. Admin role required.`,
    });
    return;
  }

  const RolesUsers = users.roles_id;
  const Roles = isAdmin[0].roles_id;

  if (RolesUsers === Roles) {
    next();
  } else {
    req.logOut((err) => {
      if (err) return next(err);
      res.status(403).json({
        user: null,
        notification: `You are not authorized to access this resource.`,
      });
    });
  }
}
