import { Router, Request, Response } from "express";
import { CertificateController } from "../../controllers/TestCloud/certificate.controller";

const router = Router();
const certificateController = new CertificateController();

router.get("/", async (req: Request, res: Response) => {
  await certificateController.getCertificate(req, res);
});

export default router;
