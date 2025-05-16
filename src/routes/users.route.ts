import { Router, Request, Response, NextFunction } from "express";
import { UsersController } from "../controllers/users.controller";
import passport from "passport";
import { Users } from "../entity/Users";
import rateLimit from "express-rate-limit";

const router = Router();
const usersController = new UsersController();

const loginLimit = rateLimit({
  windowMs: 1000 * 60 * 15,
  max: 5,
  message: 'คุณเข้าสู่ระบบเกิน 5 ครั้ง กรุณาลองอีกครั้ง ใน 5 นาที',
  headers: true
})

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

router.get("/", (req: Request, res: Response) => {
  console.log(req.user)
  const user = req.user as Users
  console.log("user roles id : ", user.roles_id)
  const users = req.user as Users
  if (req.isAuthenticated()) {
    res.status(200).json({
      message: "Home Page",
      user: users.username,
      activities: [
        {
          title: "Yoga Class",
          description: "Join our morning yoga session for relaxation and fitness.",
          date: "2025-05-20",
        },
        {
          title: "Cooking Workshop",
          description: "Learn new recipes and cooking skills from expert chefs.",
          date: "2025-05-22",
        },
        {
          title: "Tech Talk",
          description: "A discussion about the future of AI and technology.",
          date: "2025-05-25",
        },
      ],
    });
  } else {
    res.status(401).json({
      user: null
    })
  }
});

router.get("/users", Admin, async (req: Request, res: Response) => {
  const users = req.user as Users
  const getUsers = await usersController.getUsers(req, res)
  if (req.isAuthenticated()) {
    res.status(200).json({
      page: "Users Page",
      user: users,
      usersData: getUsers,
      notification: "The data connection was successful."
    })
  } else[
    res.status(401).json({
      page: "Users Page",
      user: null,
      notification: `Error fetching Users data`
    })
  ]
})

router.get("/logout", (req: Request, res: Response, next: NextFunction) => {
  const users = req.user as Users;
  req.logOut((err) => {
    if (err) return next(err);
  });
  res.status(200).json({ message: "Logged out successfully", user: null });
  console.log(req.user)
});

router.get("/login", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to the Login Page",
  });
});

router.get("/register", (req: Request, res: Response) => {
  res.status(200).json({ message: "Register Page" });
});

router.post("/register", async (req: Request, res: Response): Promise<void> => {
  await usersController.register(req, res)
})

router.post("/login", (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("local", (err: any, user: Users | false, info: any) => {
    const users = req.user as Users
    if (err) {
      return res.status(500).json({ message: "ไม่มีชื่อผู้ใช้นี้ในระบบ", user: users });
    }

    if (!user) {
      return res.status(401).json({ message: "เข้าสู่ระบบล้มเหลว !", user: users });
    }

    req.logIn(user, (err: any) => {
      if (err) {
        return res.status(500).json({ message: "! เกิดข้อผิดพลาดในการเข้าสู่ระบบ", user: users });
      }
      console.log('Logged in user:', req.user); // ดูค่าของ req.user
      return res.status(200).json({ message: "เข้าสู่ระบบสำเร็จ !", user: users });
    });
  })(req, res, next);
});

export default router;
