// import { DataSource } from "typeorm";
// import { Assessment } from "../../entity/assessment.entity";
// import { connectDatabase } from "../../db/database";
// import { ErrorHandledDao } from "../error.handled.dao";

// export class AssessmentDao extends ErrorHandledDao {
//   private dataSource: DataSource | null = null;

//   constructor() {
//     super();
//     this.initialize();
//   }

//   private async initialize(): Promise<void> {
//     try {
//       this.dataSource = await connectDatabase();
//       console.log("✅ AssessmentDao initialized");
//     } catch (error) {
//       this.logDbError("initialize", error);
//     }
//   }

//   private checkConnection(): void {
//     if (!this.dataSource?.isInitialized) {
//       throw new Error("❌ Database connection is not established");
//     }
//   }

//   async countAssessments(): Promise<number> {
//     this.checkConnection();
//     try {
//       const result = await this.dataSource!.query(
//         "SELECT COUNT(*) FROM assessment"
//       );
//       return Number(result[0].count);
//     } catch (error) {
//       this.logDbError("countAssessments", error);
//       throw error;
//     }
//   }

//   async getAssessments(page: number, limit: number): Promise<Assessment[]> {
//     this.checkConnection();
//     const offset = (page - 1) * limit;

//     try {
//       const result = await this.dataSource!.query(
//         `SELECT * FROM assessment
//          ORDER BY assessment_id ASC
//          LIMIT $1 OFFSET $2`,
//         [limit, offset]
//       );
//       return result;
//     } catch (error) {
//       this.logDbError("getAssessments", error);
//       throw error;
//     }
//   }

//   async getAssessmentByID(assessment_id: number): Promise<Assessment[]> {
//     this.checkConnection();
//     try {
//       return await this.dataSource!.query(
//         "SELECT * FROM assessment WHERE assessment_id = $1",
//         [assessment_id]
//       );
//     } catch (error) {
//       this.logDbError("getAssessmentByID", error);
//       throw error;
//     }
//   }

//   async getAssessmentByTitle(title: string): Promise<Assessment[]> {
//     this.checkConnection();
//     try {
//       return await this.dataSource!.query(
//         "SELECT * FROM assessment WHERE title = $1",
//         [title.trim()]
//       );
//     } catch (error) {
//       this.logDbError("getAssessmentByTitle", error);
//       throw error;
//     }
//   }

//   async addAssessment(
//     title: string,
//     description: string,
//     status: string
//   ): Promise<Assessment> {
//     this.checkConnection();

//     const trimmedTitle = title.trim();
//     const trimmedDescription = description.trim();
//     const trimmedStatus = status.trim();
//     const allowedStatuses = ["Active", "Inactive"];
//     if (!allowedStatuses.includes(trimmedStatus)) {
//       throw new Error(`❌ Invalid status value: ${trimmedStatus}`);
//     }

//     try {
//       const result = await this.dataSource!.query(
//         `INSERT INTO assessment (
//           title, description, status
//         ) VALUES ($1, $2, $3)
//         RETURNING *`,
//         [trimmedTitle, trimmedDescription, trimmedStatus]
//       );

//       return result[0];
//     } catch (error) {
//       this.logDbError("addAssessment", error);
//       throw error;
//     }
//   }

//   async updateAssessmentWithTitle(
//     assessment_id: number,
//     title: string,
//     description: string,
//     status: string
//   ): Promise<void> {
//     this.checkConnection();

//     try {
//       await this.dataSource!.query(
//         `UPDATE assessment SET
//           title = $1,
//           description = $2,
//           status = $3
//         WHERE assessment_id = $4`,
//         [title.trim(), description.trim(), status.trim(), assessment_id]
//       );
//     } catch (error) {
//       this.logDbError("updateAssessmentWithTitle", error);
//       throw error;
//     }
//   }

//   async updateAssessmentWithoutTitle(
//     assessment_id: number,
//     description: string,
//     status: string
//   ): Promise<void> {
//     this.checkConnection();

//     try {
//       await this.dataSource!.query(
//         `UPDATE assessment SET
//           description = $1,
//           status = $2
//         WHERE assessment_id = $3`,
//         [description.trim(), status.trim(), assessment_id]
//       );
//     } catch (error) {
//       this.logDbError("updateAssessmentWithoutTitle", error);
//       throw error;
//     }
//   }

//   async deleteAssessment(assessment_id: number): Promise<Assessment | null> {
//     this.checkConnection();
//     try {
//       const result = await this.dataSource!.query(
//         "DELETE FROM assessment WHERE assessment_id = $1 RETURNING *",
//         [assessment_id]
//       );
//       return result[0] || null;
//     } catch (error) {
//       this.logDbError("deleteAssessment", error);
//       throw error;
//     }
//   }
// }

import { DataSource } from "typeorm";
import { Assessment } from "../../entity/assessment.entity";
import { connectDatabase } from "../../db/database";
import { ErrorHandledDao } from "../error.handled.dao";

export class AssessmentDao extends ErrorHandledDao {
  private dataSource: DataSource | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      console.log("🔄 Initializing AssessmentDao...");
      this.dataSource = await connectDatabase();
      console.log("✅ AssessmentDao initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize AssessmentDao:", error);
      this.logDbError("initialize", error);
      throw error;
    }
  }

  private async checkConnection(): Promise<void> {
    if (!this.dataSource?.isConnected) {
      console.log("🔄 Database connection not established, attempting to initialize...");
      try {
        await this.initialize();
      } catch (error) {
        throw new Error(`❌ Database connection is not established: ${error}`);
      }
    }
  }

  async countAssessments(): Promise<number> {
    await this.checkConnection();
    try {
      const result = await this.dataSource!.query("SELECT COUNT(*) FROM assessment");
      return Number(result[0].count);
    } catch (error) {
      this.logDbError("countAssessments", error);
      throw error;
    }
  }

  async getAssessments(page: number, limit: number): Promise<Assessment[]> {
    await this.checkConnection();
    const offset = (page - 1) * limit;

    try {
      const result = await this.dataSource!.query(
        `SELECT * FROM assessment
         ORDER BY assessment_id ASC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      return result;
    } catch (error) {
      this.logDbError("getAssessments", error);
      throw error;
    }
  }

  async getAssessmentByID(assessment_id: number): Promise<Assessment[]> {
    await this.checkConnection();
    try {
      return await this.dataSource!.query(
        "SELECT * FROM assessment WHERE assessment_id = $1",
        [assessment_id]
      );
    } catch (error) {
      this.logDbError("getAssessmentByID", error);
      throw error;
    }
  }

  async getAssessmentByTitle(assessment_name: string): Promise<Assessment[]> {
    await this.checkConnection();
    try {
      return await this.dataSource!.query(
        "SELECT * FROM assessment WHERE assessment_name = $1",
        [assessment_name.trim()]
      );
    } catch (error) {
      this.logDbError("getAssessmentByTitle", error);
      throw error;
    }
  }

  async addAssessment(
    assessment_name: string,
    description: string,
    status: string,
    assessment_status: string,
    create_date: Date,
    last_update: Date
  ): Promise<Assessment> {
    await this.checkConnection();

    const trimmedName = assessment_name.trim();
    const trimmedDescription = description.trim();
    const trimmedStatus = status.trim();
    const trimmedAssessmentStatus = assessment_status.trim();
    const allowedStatuses = ["Active", "Inactive"];
    const allowedAssessmentStatuses = ["Not finished", "Finished", "Unsuccessful"];

    if (!allowedStatuses.includes(trimmedStatus)) {
      throw new Error(`❌ Invalid status value: ${trimmedStatus}`);
    }

    if (!allowedAssessmentStatuses.includes(trimmedAssessmentStatus)) {
      throw new Error(`❌ Invalid assessment_status value: ${trimmedAssessmentStatus}`);
    }

    try {
      const result = await this.dataSource!.query(
        `INSERT INTO assessment (
          assessment_name, description, status, assessment_status, create_date, last_update
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
        [trimmedName, trimmedDescription, trimmedStatus, trimmedAssessmentStatus, create_date, last_update]
      );

      return result[0];
    } catch (error) {
      this.logDbError("addAssessment", error);
      throw error;
    }
  }

  async updateAssessmentWithName(
    assessment_id: number,
    assessment_name: string,
    description: string,
    status: string,
    assessment_status: string,
    last_update: Date
  ): Promise<void> {
    await this.checkConnection();

    try {
      await this.dataSource!.query(
        `UPDATE assessment SET
          assessment_name = $1,
          description = $2,
          status = $3,
          assessment_status = $4,
          last_update = $5
        WHERE assessment_id = $6`,
        [assessment_name.trim(), description.trim(), status.trim(), assessment_status.trim(), last_update, assessment_id]
      );
    } catch (error) {
      this.logDbError("updateAssessmentWithName", error);
      throw error;
    }
  }


  async addAssessmentFull(data: any): Promise<Assessment> {
    await this.checkConnection();

    return await this.dataSource!.transaction(async (manager) => {
      // 1. Insert assessment
      const [assessment] = await manager.query(
        `INSERT INTO assessment (assessment_name, description, status, assessment_status, create_date, last_update)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
        [
          data.assessment_name,
          data.description,
          data.status,
          data.assessment_status,
          data.create_date,
          data.last_update,
        ]
      );

      // 2. Insert setNumbers
      for (const section of data.sections) {
        const [setNumber] = await manager.query(
          `INSERT INTO set_number (name, status, assessment_id)
         VALUES ($1, $2, $3) RETURNING *`,
          [section.title, "Active", assessment.assessment_id]
        );

        // 3. Insert questions
        for (const question of section.questions) {
          const [q] = await manager.query(
            `INSERT INTO question (question_text, question_number, set_number_id, question_type)
           VALUES ($1, $2, $3, $4) RETURNING *`,
            [question.question, 1, setNumber.set_number_id, question.type]
          );

          // 4. Insert choices
          for (const opt of question.options || []) {
            await manager.query(
              `INSERT INTO choice (choice_text, question_id)
             VALUES ($1, $2)`,
              [opt, q.question_id]
            );
          }
        }
      }

      return assessment;
    });
  }



  async getAssessmentFullById(assessment_id: number): Promise<any> {
  await this.checkConnection();

  const assessment = await this.dataSource!.query(
    `SELECT * FROM assessment WHERE assessment_id = $1`,
    [assessment_id]
  );

  if (!assessment.length) return null;

  const setNumbers = await this.dataSource!.query(
    `SELECT * FROM set_number WHERE assessment_id = $1 ORDER BY 
     CASE 
       WHEN name ~ '^หัวข้อ ([0-9]+):' THEN 
         CAST(SUBSTRING(name FROM '^หัวข้อ ([0-9]+):') AS INTEGER)
       ELSE 999
     END ASC, set_number_id ASC`,
    [assessment_id]
  );

  for (const section of setNumbers) {
    const questions = await this.dataSource!.query(
      `SELECT * FROM question WHERE set_number_id = $1`,
      [section.set_number_id]
    );

    for (const q of questions) {
      const choices = await this.dataSource!.query(
        `SELECT * FROM choice WHERE question_id = $1`,
        [q.question_id]
      );
      q.choices = choices;
    }

    section.questions = questions;
  }

  return {
    ...assessment[0],
    sections: setNumbers,
  };
}

  async updateAssessmentWithoutName(
    assessment_id: number,
    description: string,
    status: string,
    assessment_status: string,
    last_update: Date
  ): Promise<void> {
    await this.checkConnection();

    try {
      await this.dataSource!.query(
        `UPDATE assessment SET
          description = $1,
          status = $2,
          assessment_status = $3,
          last_update = $4
        WHERE assessment_id = $5`,
        [description.trim(), status.trim(), assessment_status.trim(), last_update, assessment_id]
      );
    } catch (error) {
      this.logDbError("updateAssessmentWithoutName", error);
      throw error;
    }
  }

  async deleteAssessment(assessment_id: number): Promise<Assessment | null> {
    await this.checkConnection();
    try {
      const result = await this.dataSource!.query(
        "DELETE FROM assessment WHERE assessment_id = $1 RETURNING *",
        [assessment_id]
      );
      return result[0] || null;
    } catch (error) {
      this.logDbError("deleteAssessment", error);
      throw error;
    }
  }
}
