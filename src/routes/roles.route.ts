import { Router } from "express";
import { RolesController } from "../controllers/roles.controller";
import { wrapAsync } from "../utils/wrapAsync";
import { Admin } from "../middleware/CheckRole";

const router = Router();
const rolesController = new RolesController();

// ✅ GET: บทบาททั้งหมด + count
router.get(
  "/data",
  // Admin,
  wrapAsync(rolesController.getAll.bind(rolesController))
);

// ✅ POST: เพิ่มบทบาทใหม่
router.post(
  "/add",
  // Admin,
  wrapAsync(rolesController.create.bind(rolesController))
);

// ✅ PUT: แก้ไขบทบาทตาม id
router.put(
  "/edit/:roles_id",
  // Admin,
  wrapAsync(rolesController.update.bind(rolesController))
);

// ✅ DELETE: ลบบทบาทตาม id
router.delete(
  "/delete/:roles_id",
  // Admin,
  wrapAsync(rolesController.delete.bind(rolesController))
);

export default router;
