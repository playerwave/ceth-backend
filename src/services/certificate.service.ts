import { CertificateDao } from "../daos/Admin/certificate.dao";
import { Certificate } from "../interfaces/Certificate";

export class CertificateService {
  private certificateDao = new CertificateDao();

  async getAllCertificates(): Promise<Certificate[]> {
    return this.certificateDao.getAllCertificates();
  }

  async getCertificateById(id: number): Promise<Certificate | null> {
    return this.certificateDao.getCertificateById(id);
  }
}
