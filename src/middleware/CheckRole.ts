import { Request, Response, NextFunction } from "express";
import { UsersController } from "../controllers/users.controller";
import { Users } from "../entity/users.entity";

const usersController = new UsersController();

//--------------------- CheckRole Function -------------------------
export function CheckRole(
  allowedRoles: string[]
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    console.log("🔍 [CheckRole] req.user:", req.user);
    const user = req.user;
    
    if (!user || !user.roles_id) {
      console.log("❌ [CheckRole] No user or roles_id");
      res.status(401).json({
        user: null,
        notification: `Unauthorized access. Please log in.`,
      });
      return;
    }

    // แปลง roles_id เป็น role name
    const roleMap: { [key: number]: string } = {
      1: 'Admin',
      2: 'Teacher', 
      3: 'Student'
    };

    const userRoleName = roleMap[user.roles_id];
    
    if (!userRoleName) {
      res.status(403).json({
        user: null,
        notification: `Invalid user role.`,
      });
      return;
    }

    // ตรวจสอบว่า role ของ user อยู่ใน allowedRoles หรือไม่
    if (allowedRoles.includes(userRoleName)) {
      next();
    } else {
      res.status(403).json({
        user: null,
        notification: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
      });
    }
  };
}
//----------------------------------------------------------------

export async function Admin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const user = req.user;
  if (!user || !user.roles_id) {
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

  const RolesUsers = user.roles_id;
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
