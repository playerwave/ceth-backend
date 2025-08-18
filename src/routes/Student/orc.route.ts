// src/routes/Student/ocr.route.ts
import { Router, Request, Response } from "express";
import multer from "multer";
import { callTyphoonOCR } from "../../services/Student/ocr.service";

// จำกัด 20MB
const upload = multer({ limits: { fileSize: 20 * 1024 * 1024 } });

const router = Router();

// POST /api/ocr
router.post(
  "/",
  upload.single("file"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded (field 'file')." });
        return;
      }

      const data = await callTyphoonOCR(
        {
          buffer: req.file.buffer,
          filename: req.file.originalname,
          mimetype: req.file.mimetype,
        },
        { model: "typhoon-ocr-preview" }
      );

      res.json(data);
      return;
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err?.message || "Internal Server Error" });
      return;
    }
  }
);

export default router;
