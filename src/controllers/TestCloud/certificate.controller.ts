import { Request, Response } from "express";
import { CertificateService } from "../../services/TestCloud/certificate.service";

export class CertificateController {
  private certificateService = new CertificateService();

  // ฟังก์ชันสำหรับแสดงรายชื่อผู้ใช้
  getCertificate = async (req: Request, res: Response) => {
    try {
      const certificates = await this.certificateService.getCertificate();
      return res.render("certificate.ejs", {
        certificate: certificates,
      });
    } catch (error) {
      res.status(500).send("Error to Response");
    }
  };
}
