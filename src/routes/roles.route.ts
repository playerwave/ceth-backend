import { Router } from "express";
import { RolesController } from "../controllers/roles.controller";
import { wrapAsync } from "../utils/wrapAsync";
import { Admin } from "../middleware/CheckRole";

const router = Router();
const rolesController = new RolesController();

// ✅ GET: บทบาททั้งหมด + count
router.get("/data", Admin, wrapAsync(rolesController.getAll));

// ✅ POST: เพิ่มบทบาทใหม่
router.post("/add", Admin, wrapAsync(rolesController.create));

// ✅ PUT: แก้ไขบทบาทตาม id
router.put("/edit/:roles_id", Admin, wrapAsync(rolesController.update));

// ✅ DELETE: ลบบทบาทตาม id
router.delete("/delete/:roles_id", Admin, wrapAsync(rolesController.delete));

export default router;
