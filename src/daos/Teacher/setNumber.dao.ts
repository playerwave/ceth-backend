import { DataSource } from "typeorm";
import { SetNumber } from "../../entity/Assessment/setNumbers.entity";
import { connectDatabase } from "../../db/database";
import { ErrorHandledDao } from "../error.handled.dao";

export class SetNumberDao extends ErrorHandledDao {
  private dataSource: DataSource | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      this.dataSource = await connectDatabase();
      console.log("✅ SetNumberDao initialized");
    } catch (error) {
      this.logDbError("initialize", error);
    }
  }

  private checkConnection(): void {
    if (!this.dataSource?.isInitialized) {
      throw new Error("❌ Database connection is not established");
    }
  }

  async countSetNumbers(): Promise<number> {
    this.checkConnection();
    try {
      const result = await this.dataSource!.query(
        "SELECT COUNT(*) FROM set_number"
      );
      return Number(result[0].count);
    } catch (error) {
      this.logDbError("countSetNumbers", error);
      throw error;
    }
  }

  async getSetNumbers(): Promise<SetNumber[]> {
    this.checkConnection();

    try {
      const result = await this.dataSource!.query(
        `SELECT * FROM set_number ORDER BY set_number_id ASC`,);
      return result;
    } catch (error) {
      this.logDbError("getSetNumbers", error);
      throw error;
    }
  }

  async getSetNumberByID(set_number_id: number): Promise<SetNumber[]> {
    this.checkConnection();
    try {
      return await this.dataSource!.query(
        "SELECT * FROM set_number WHERE set_number_id = $1",
        [set_number_id]
      );
    } catch (error) {
      this.logDbError("getSetNumberByID", error);
      throw error;
    }
  }

  async getSetNumbersByAssessmentID(assessment_id: number): Promise<SetNumber[]> {
    this.checkConnection();

    try {
      const result = await this.dataSource!.query(
        `SELECT sn.set_number_id, sn.name, sn.status, sn.assessment_id, am.assessment_name, am.description, am.assessment_status, am.status FROM set_number as sn INNER JOIN assessment as am ON sn.assessment_id = am.assessment_id WHERE sn.assessment_id = $1 ORDER BY sn.set_number_id ASC`, [assessment_id]);
      console.log("🔍 getSetNumbersByAssessmentID result:", result.map(r => ({ id: r.set_number_id, name: r.name })));
      return result;
    } catch (error) {
      this.logDbError("getSetNumbersByAssessmentID", error);
      throw error;
    }
  }

  async addSetNumber(name: string, status: string | undefined, assessment_id: number): Promise<SetNumber> {
    this.checkConnection();

    // ข้อมูลจะถูก validate แล้วโดย DTO และ Service layer
    const trimmedName = name.trim();
    const trimmedStatus = status?.trim() || 'Active'; // Default to 'Active' if status is undefined

    try {
      const result = await this.dataSource!.query(
        `INSERT INTO set_number (name, status, assessment_id) VALUES ($1, $2, $3)
        RETURNING *`,
        [trimmedName, trimmedStatus, assessment_id]
      );

      return result[0];
    } catch (error) {
      this.logDbError("addSetNumber", error);
      throw error;
    }
  }

  async updateSetNumber(
    set_number_id: number,
    name: string,
    status: string | undefined,
    assessment_id: number
  ): Promise<SetNumber | null> {
    this.checkConnection();

    try {
      const trimmedName = name.trim();
      const trimmedStatus = status?.trim() || 'Active'; // Default to 'Active' if status is undefined

      const result = await this.dataSource!.query(
        `UPDATE set_number SET
          name = $1,
          status = $2, assessment_id = $3
        WHERE set_number_id = $4
        RETURNING *`,
        [trimmedName, trimmedStatus, assessment_id, set_number_id]
      );

      return result[0] || null;
    } catch (error) {
      this.logDbError("updateSetNumber", error);
      throw error;
    }
  }

  async deleteSetNumber(set_number_id: number): Promise<SetNumber | null> {
    this.checkConnection();
    try {
      const result = await this.dataSource!.query(
        "DELETE FROM set_number WHERE set_number_id = $1 RETURNING *",
        [set_number_id]
      );
      return result[0] || null;
    } catch (error) {
      this.logDbError("deleteSetNumber", error);
      throw error;
    }
  }

  async deleteSetNumberByAssessmentID(assessment_id: number): Promise<SetNumber | null> {
    this.checkConnection();
    try {
      const result = await this.dataSource!.query(
        "DELETE FROM set_number WHERE assessment_id = $1 RETURNING *",
        [assessment_id]
      );
      return result[0] || null;
    } catch (error) {
      this.logDbError("deleteSetNumberByAssessmentID", error);
      throw error;
    }
  }
}





// import { DataSource } from "typeorm";
// import { SetNumber } from "../../entity/setNumbers.entity";
// import { connectDatabase } from "../../db/database";
// import { ErrorHandledDao } from "../error.handled.dao";

// export class SetNumberDao extends ErrorHandledDao {
//   private dataSource: DataSource | null = null;

//   constructor() {
//     super();
//     this.initialize();
//   }

//   private async initialize(): Promise<void> {
//     try {
//       this.dataSource = await connectDatabase();
//       console.log("✅ SetNumberDao initialized");
//     } catch (error) {
//       this.logDbError("initialize", error);
//     }
//   }

//   private checkConnection(): void {
//     if (!this.dataSource?.isInitialized) {
//       throw new Error("❌ Database connection is not established");
//     }
//   }

//   async countSetNumbers(): Promise<number> {
//     this.checkConnection();
//     try {
//       const result = await this.dataSource!.query(
//         "SELECT COUNT(*) FROM set_number"
//       );
//       return Number(result[0].count);
//     } catch (error) {
//       this.logDbError("countSetNumbers", error);
//       throw error;
//     }
//   }

//   async getSetNumbers(page: number, limit: number): Promise<SetNumber[]> {
//     this.checkConnection();
//     const offset = (page - 1) * limit;

//     try {
//       const result = await this.dataSource!.query(
//         `SELECT * FROM set_number
//          ORDER BY set_number_id ASC
//          LIMIT $1 OFFSET $2`,
//         [limit, offset]
//       );
//       return result;
//     } catch (error) {
//       this.logDbError("getSetNumbers", error);
//       throw error;
//     }
//   }

//   async getSetNumbersQuestionByID(set_number_id: number): Promise<SetNumber[]> {
//     this.checkConnection();

//     try {
//       const sql = `SELECT q.question_id, q.question_number, question_text, question_type FROM set_number as sm INNER JOIN question as q ON sm.set_number_id = q.set_number_id WHERE sm.set_number_id = $1 ORDER BY q.question_number ASC`
//       const result = await this.dataSource!.query(sql, [set_number_id]);
//       return result;
//     } catch (error) {
//       this.logDbError("getSetNumbersQuestionByID", error);
//       throw error;
//     }
//   }

//   async getSetNumberByID(set_number_id: number): Promise<SetNumber[]> {
//     this.checkConnection();
//     try {
//       return await this.dataSource!.query(
//         "SELECT * FROM set_number WHERE set_number_id = $1",
//         [set_number_id]
//       );
//     } catch (error) {
//       this.logDbError("getSetNumberByID", error);
//       throw error;
//     }
//   }

//   async getSetNumberByName(name: string): Promise<SetNumber[]> {
//     this.checkConnection();
//     try {
//       return await this.dataSource!.query(
//         "SELECT * FROM set_number WHERE name = $1",
//         [name.trim()]
//       );
//     } catch (error) {
//       this.logDbError("getSetNumberByName", error);
//       throw error;
//     }
//   }

//   async addSetNumber(name: string, status: string | undefined): Promise<SetNumber> {
//     this.checkConnection();

//     // ข้อมูลจะถูก validate แล้วโดย DTO และ Service layer
//     const trimmedName = name.trim();
//     const trimmedStatus = status?.trim() || 'Active'; // Default to 'Active' if status is undefined

//     try {
//       const result = await this.dataSource!.query(
//         `INSERT INTO set_number (
//           name, status
//         ) VALUES ($1, $2)
//         RETURNING *`,
//         [trimmedName, trimmedStatus]
//       );

//       return result[0];
//     } catch (error) {
//       this.logDbError("addSetNumber", error);
//       throw error;
//     }
//   }

//   async updateSetNumber(
//     set_number_id: number,
//     name: string,
//     status: string | undefined
//   ): Promise<SetNumber | null> {
//     this.checkConnection();

//     try {
//       const trimmedName = name.trim();
//       const trimmedStatus = status?.trim() || 'Active'; // Default to 'Active' if status is undefined

//       const result = await this.dataSource!.query(
//         `UPDATE set_number SET
//           name = $1,
//           status = $2
//         WHERE set_number_id = $3
//         RETURNING *`,
//         [trimmedName, trimmedStatus, set_number_id]
//       );

//       return result[0] || null;
//     } catch (error) {
//       this.logDbError("updateSetNumber", error);
//       throw error;
//     }
//   }

//   async deleteSetNumber(set_number_id: number): Promise<SetNumber | null> {
//     this.checkConnection();
//     try {
//       const result = await this.dataSource!.query(
//         "DELETE FROM set_number WHERE set_number_id = $1 RETURNING *",
//         [set_number_id]
//       );
//       return result[0] || null;
//     } catch (error) {
//       this.logDbError("deleteSetNumber", error);
//       throw error;
//     }
//   }
// }
