import pool from "../../db/database";
import { Certificate } from "../../interfaces/Certificate";

export class CertificateDao {
  async getAllCertificates(): Promise<Certificate[]> {
    const { rows } = await pool.query(`SELECT * FROM certificate ORDER BY certificate_id`);
    return rows;
  }

  async getCertificateById(certificate_id: number): Promise<Certificate | null> {
    const { rows } = await pool.query(`SELECT * FROM certificate WHERE certificate_id = $1`, [certificate_id]);
    return rows[0] || null;
  }
}
