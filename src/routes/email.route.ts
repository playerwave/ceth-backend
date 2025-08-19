import express from "express";
import { previewEmailTemplate, listAvailableTemplates, sendEmailTemplate } from "../controllers/email.controller";

const router = express.Router();

// GET /api/email/templates - รายการ templates ที่มีอยู่
router.get("/templates", listAvailableTemplates);

// POST /api/email/preview - preview template ด้วยข้อมูล
router.post("/preview", previewEmailTemplate);

// POST /api/email/send - ส่งอีเมล
router.post("/send", sendEmailTemplate);

export default router;
