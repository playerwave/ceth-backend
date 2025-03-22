import { CertificateDao } from "../../daos/TestCloud/certificate.dao";
import { Certificate } from "../../entity/Certificate";
export class CertificateService {
  private certificateDao = new CertificateDao();

  async getCertificate(): Promise<Certificate[]> {
    return await this.certificateDao.getCertificate();
  }
}
